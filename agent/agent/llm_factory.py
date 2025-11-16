import os
from typing import Optional, Dict, Any, List

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.embeddings import Embeddings
from langchain_openai import ChatOpenAI
from langchain_openai import OpenAIEmbeddings
from langchain_core.messages import BaseMessage, AIMessage, ChatMessage
from langchain_core.outputs import ChatGeneration, ChatResult

from agent.gemini_integration import ChatGemini
from agent.gemini_embeddings import GeminiEmbeddings


class SimpleFallbackLLM(BaseChatModel):
    """A simple fallback LLM that works offline with basic templated responses."""
    
    temperature: float = 0.7
    
    def _generate(self, messages: List[BaseMessage], **kwargs) -> ChatResult:
        """Generate a simple response based on keywords in the user's message."""
        # Get the last message which should be from the user
        if not messages:
            response_text = "I'm here to listen. How can I help you today?"
        else:
            last_message = messages[-1]
            user_input = last_message.content.lower()
            
            # Simple keyword-based responses
            if any(word in user_input for word in ["sad", "upset", "depressed"]):
                response_text = "I understand you're feeling down. It's important to acknowledge these feelings. Would you like to talk more about what's causing you to feel this way?"
            elif any(word in user_input for word in ["anxious", "worried", "nervous", "stress"]):
                response_text = "Feeling anxious is very common. Sometimes taking deep breaths can help in the moment. Would you like to explore some calming techniques together?"
            elif any(word in user_input for word in ["happy", "good", "great", "wonderful"]):
                response_text = "I'm glad to hear you're feeling positive! What's been contributing to these good feelings?"
            elif any(word in user_input for word in ["tired", "exhausted", "sleep"]):
                response_text = "Rest is so important for our mental wellbeing. Have you been having trouble sleeping lately?"
            elif any(word in user_input for word in ["hello", "hi", "hey"]):
                response_text = "Hello! I'm here to support you. How are you feeling today?"
            else:
                response_text = "Thank you for sharing. I'm listening and here to support you. Could you tell me more about how you're feeling?"
        
        message = AIMessage(content=response_text)
        generation = ChatGeneration(message=message)
        return ChatResult(generations=[generation])
    
    @property
    def _llm_type(self) -> str:
        return "simple_fallback"


class SimpleOfflineEmbeddings(Embeddings):
    """Simple fallback embeddings that produce random vectors."""
    
    dimension: int = 128
    
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Generate random embeddings of the same dimension for offline mode."""
        import random
        random.seed(42)  # For reproducibility
        return [[random.uniform(-1, 1) for _ in range(self.dimension)] for _ in texts]
    
    def embed_query(self, text: str) -> List[float]:
        """Generate a random embedding for a query."""
        import random
        random.seed(hash(text) % 10000)  # Seed based on text for consistency
        return [random.uniform(-1, 1) for _ in range(self.dimension)]


class LLMFactory:
    """Factory class to create LLM instances based on available API keys."""
    
    @staticmethod
    def create_llm(
        provider: Optional[str] = None, 
        temperature: float = 0.7,
        max_tokens: int = 4096,
        **kwargs
    ) -> BaseChatModel:
        """
        Create an LLM instance based on available API keys or specified provider.
        
        Args:
            provider: Optional provider to use ('openai', 'gemini', or 'groq')
            temperature: Temperature for the model
            **kwargs: Additional arguments to pass to the model
            
        Returns:
            A LangChain chat model instance
        """
        # Check if we're in offline mode (environment variable)
        if os.environ.get("OFFLINE_MODE") == "true":
            print("Using offline fallback LLM")
            return SimpleFallbackLLM(temperature=temperature)
            
        # If provider is specified, try to use it
        if provider:
            if provider.lower() == "openai":
                if not os.environ.get("OPENAI_API_KEY"):
                    raise ValueError("OpenAI API key not found but provider explicitly set to OpenAI")
                return ChatOpenAI(temperature=temperature, **kwargs)
            elif provider.lower() == "gemini":
                if not os.environ.get("GOOGLE_API_KEY"):
                    raise ValueError("Google API key not found but provider explicitly set to Gemini")
                # Use the correct model name for Gemini
                model_name = os.environ.get("GEMINI_MODEL_NAME", "gemini-1.5-pro")
                api_version = os.environ.get("GEMINI_API_VERSION", "v1")
                return ChatGemini(
                    temperature=temperature, 
                    model_name=model_name,
                    api_version=api_version,
                    **kwargs
                )
            elif provider.lower() == "groq":
                if not os.environ.get("GROQ_API_KEY"):
                    raise ValueError("Groq API key not found but provider explicitly set to Groq")
                # Use ChatOpenAI with Groq's base URL and API key
                return ChatOpenAI(
                    temperature=temperature,
                    base_url="https://api.groq.com/openai/v1",
                    api_key=os.environ.get("GROQ_API_KEY"),
                    model_name="llama-3.3-70b-versatile", # Default model, can be overridden with kwargs
                    **kwargs
                )
            else:
                raise ValueError(f"Unsupported provider: {provider}")
        
        # Auto-detect based on available API keys
        if os.environ.get("OPENAI_API_KEY"):
            return ChatOpenAI(temperature=temperature, **kwargs)
        elif os.environ.get("GROQ_API_KEY"):
            return ChatOpenAI(
                temperature=temperature,
                base_url="https://api.groq.com/openai/v1",
                api_key=os.environ.get("GROQ_API_KEY"),
                model_name="llama-3.3-70b-versatile", # Default model
                **kwargs
            )
        elif os.environ.get("GOOGLE_API_KEY"):
            return ChatGemini(temperature=temperature, **kwargs)
        else:
            print("No API keys found. Using offline fallback LLM.")
            return SimpleFallbackLLM(temperature=temperature)
    
    @staticmethod
    def create_embeddings(provider: Optional[str] = None) -> Embeddings:
        """
        Create an embeddings instance based on available API keys or specified provider.
        
        Args:
            provider: Optional provider to use ('openai', 'gemini', or 'groq')
            
        Returns:
            A LangChain embeddings instance
        """
        # Check if we're in offline mode
        if os.environ.get("OFFLINE_MODE") == "true":
            print("Using offline simple embeddings")
            return SimpleOfflineEmbeddings()
        
        # If provider is specified, try to use it
        if provider:
            if provider.lower() == "openai":
                if not os.environ.get("OPENAI_API_KEY"):
                    raise ValueError("OpenAI API key not found but provider explicitly set to OpenAI")
                return OpenAIEmbeddings()
            elif provider.lower() == "gemini":
                if not os.environ.get("GOOGLE_API_KEY"):
                    raise ValueError("Google API key not found but provider explicitly set to Gemini")
                return GeminiEmbeddings()
            elif provider.lower() == "groq":
                if not os.environ.get("GROQ_API_KEY"):
                    raise ValueError("Groq API key not found but provider explicitly set to Groq")
                # Use OpenAIEmbeddings with Groq's base URL and API key
                # Note: Groq might not support embeddings yet, so this might fall back to OpenAI
                return OpenAIEmbeddings(
                    base_url="https://api.groq.com/openai/v1",
                    api_key=os.environ.get("GROQ_API_KEY")
                )
            else:
                raise ValueError(f"Unsupported provider: {provider}")
        
        # Auto-detect based on available API keys
        if os.environ.get("OPENAI_API_KEY"):
            return OpenAIEmbeddings()
        elif os.environ.get("GROQ_API_KEY"):
            try:
                return OpenAIEmbeddings(
                    base_url="https://api.groq.com/openai/v1",
                    api_key=os.environ.get("GROQ_API_KEY")
                )
            except Exception as e:
                # If Groq doesn't support embeddings, log error
                print(f"Warning: Groq embeddings failed: {e}")
                if os.environ.get("GOOGLE_API_KEY"):
                    return GeminiEmbeddings()
                else:
                    print("Using offline simple embeddings as fallback")
                    return SimpleOfflineEmbeddings()
        elif os.environ.get("GOOGLE_API_KEY"):
            return GeminiEmbeddings()
        else:
            print("No embedding providers available. Using simple offline embeddings.")
            return SimpleOfflineEmbeddings() 