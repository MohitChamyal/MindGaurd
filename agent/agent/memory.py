from typing import List, Dict, Any, Optional

from langchain_community.vectorstores import FAISS
from langchain.memory import ConversationBufferMemory
from langchain_core.embeddings import Embeddings
from agent.llm_factory import LLMFactory

class MemoryManager:
    def __init__(self, provider: Optional[str] = None):
        """
        Initialize the memory manager.
        
        Args:
            provider: Optional provider to use ('openai' or 'gemini')
        """
        self.memory = ConversationBufferMemory(return_messages=True)
        self.provider = provider
        
        # Try to initialize embeddings, but have a fallback if it fails
        try:
            self.embeddings = LLMFactory.create_embeddings(provider)
            self.vector_store = None
            self.vector_storage_available = True
        except Exception as e:
            print(f"Warning: Could not initialize embeddings: {e}")
            self.vector_storage_available = False
        
        # Simple conversation storage for metadata and context
        self.conversations = []
        
    def save_conversation(self, user_input: str, ai_response: str, metadata: Optional[Dict[str, Any]] = None):
        """
        Save a conversation turn to memory.
        
        Args:
            user_input: The user's input
            ai_response: The AI's response
            metadata: Optional metadata about the conversation
        """
        # Save to LangChain memory for retrieval
        self.memory.save_context(
            {"input": user_input},
            {"output": ai_response}
        )
        
        # Save with metadata for our own tracking
        conversation = {
            "input": user_input,
            "output": ai_response,
            "metadata": metadata or {}
        }
        self.conversations.append(conversation)
        
        # If we have a vector store and it's available, add the conversation to it
        if self.vector_storage_available and self.vector_store:
            try:
                self.vector_store.add_texts(
                    [f"User: {user_input}\nAI: {ai_response}"],
                    metadatas=[metadata or {}]
                )
            except Exception as e:
                print(f"Warning: Could not add to vector store: {e}")

    def get_history(self) -> List[Dict[str, Any]]:
        """
        Get the conversation history.
        
        Returns:
            The conversation history
        """
        return self.memory.load_memory_variables({})["history"]
    
    def initialize_vector_store(self, texts: Optional[List[str]] = None):
        """
        Initialize the vector store with optional initial texts.
        
        Args:
            texts: Optional list of texts to initialize the vector store with
        """
        if not self.vector_storage_available:
            print("Vector storage not available")
            return
            
        if not texts:
            texts = []
        
        try:
            self.vector_store = FAISS.from_texts(texts, self.embeddings)
        except Exception as e:
            print(f"Warning: Could not initialize vector store: {e}")
            self.vector_storage_available = False
    
    def find_similar_conversations(self, query: str, k: int = 3) -> List[Dict[str, Any]]:
        """
        Search for similar conversations.
        
        Args:
            query: The query to search for
            k: The number of results to return
            
        Returns:
            A list of similar conversations with input, output, and metadata
        """
        # If vector storage is not available, fall back to keyword matching
        if not self.vector_storage_available or not self.vector_store:
            if not self.vector_storage_available:
                print("Using keyword matching for conversation search (vector store not available)")
            
            if not self.conversations:
                return []
                
            # Simple keyword matching as fallback
            query_terms = set(query.lower().split())
            scored_conversations = []
            
            for conv in self.conversations:
                input_terms = set(conv["input"].lower().split())
                # Calculate simple overlap score
                overlap = len(query_terms.intersection(input_terms))
                scored_conversations.append((overlap, conv))
            
            # Sort by score using the first element of the tuple (overlap score)
            # This avoids direct dict comparison
            scored_conversations.sort(key=lambda x: x[0], reverse=True)
            return [conv for _, conv in scored_conversations[:k]]
            
        # Use vector search if available
        try:
            self.initialize_vector_store()
            results = self.vector_store.similarity_search(query, k=k)
            
            # Convert results to the right format
            conversations = []
            for doc in results:
                content = doc.page_content
                parts = content.split("\nAI: ", 1)
                if len(parts) == 2:
                    user_input = parts[0].replace("User: ", "")
                    ai_output = parts[1]
                    conversations.append({
                        "input": user_input,
                        "output": ai_output,
                        "metadata": doc.metadata
                    })
            
            return conversations
        except Exception as e:
            print(f"Warning: Error searching vector store: {e}")
            return []