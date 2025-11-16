import os
from typing import List
import google.generativeai as genai
from langchain_core.embeddings import Embeddings

class GeminiEmbeddings(Embeddings):
    """LangChain compatible wrapper for Google's Gemini embeddings."""
    
    model_name: str = "embedding-001"
    
    def __init__(self, **kwargs):
        """Initialize the Gemini embeddings model."""
        super().__init__(**kwargs)
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable not set")
        genai.configure(api_key=api_key)
        
        # Initialize the model
        self.model = genai.GenerativeModel(self.model_name)
    
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embed a list of documents using Gemini."""
        embeddings = []
        for text in texts:
            result = self.model.embed_content(text)
            embeddings.append(result.embedding)
        return embeddings
    
    def embed_query(self, text: str) -> List[float]:
        """Embed a query using Gemini."""
        result = self.model.embed_content(text)
        return result.embedding 