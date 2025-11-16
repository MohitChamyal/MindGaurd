import os
from typing import Dict, Any, List
import google.generativeai as genai
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
)
from langchain_core.outputs import ChatGeneration, ChatResult
from pydantic import Field

class ChatGemini(BaseChatModel):
    """LangChain compatible wrapper for Google's Gemini API."""
    
    model_name: str = "gemini-pro"
    temperature: float = 0.7
    top_p: float = 0.95
    top_k: int = 0
    max_output_tokens: int = 2048
    
    def __init__(self, **kwargs):
        """Initialize the Gemini chat model."""
        super().__init__(**kwargs)
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable not set")
        genai.configure(api_key=api_key)
        
        # Initialize the model
        try:
            self._gemini_model = genai.GenerativeModel(self.model_name)
        except Exception as e:
            raise ValueError(f"Failed to initialize Gemini model: {e}")
    
    def _generate(self, messages: List[BaseMessage], **kwargs) -> ChatResult:
        """Generate a response using the Gemini model."""
        prompt = self._convert_messages_to_prompt(messages)
        
        # Set up generation config directly in the generate_content call
        response = self._gemini_model.generate_content(
            prompt,
            generation_config={
                "temperature": self.temperature,
                "top_p": self.top_p,
                "top_k": self.top_k,
                "max_output_tokens": self.max_output_tokens,
            }
        )
        
        # Convert to LangChain format
        message = AIMessage(content=response.text)
        generation = ChatGeneration(message=message)
        return ChatResult(generations=[generation])
    
    def _convert_messages_to_prompt(self, messages: List[BaseMessage]) -> str:
        """Convert LangChain messages to a format Gemini can understand."""
        prompt_parts = []
        
        for message in messages:
            if isinstance(message, SystemMessage):
                # Prepend system message as context
                prompt_parts.append(f"System: {message.content}")
            elif isinstance(message, HumanMessage):
                prompt_parts.append(f"Human: {message.content}")
            elif isinstance(message, AIMessage):
                prompt_parts.append(f"AI: {message.content}")
        
        return "\n".join(prompt_parts)
    
    @property
    def _llm_type(self) -> str:
        """Return the type of LLM."""
        return "gemini"


# Helper function to create embeddings using Gemini
def get_gemini_embeddings(text: str) -> List[float]:
    """Get embeddings for text using Gemini's embedding model."""
    model = genai.GenerativeModel("embedding-001")
    result = model.embed_content(text)
    return result.embedding 