import os
from typing import List
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential
import time

class EmbeddingService:
    def __init__(self, api_key: str = None):
        self.client = OpenAI(api_key=api_key or os.getenv("OPENAI_API_KEY"))
        self.model = "text-embedding-3-small"
        self.batch_size = 100
        self.rate_limit_delay = 0.1  # seconds between requests
        
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for a single text."""
        response = self.client.embeddings.create(
            model=self.model,
            input=text
        )
        return response.data[0].embedding
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts with batching."""
        all_embeddings = []
        
        for i in range(0, len(texts), self.batch_size):
            batch = texts[i:i + self.batch_size]
            
            response = self.client.embeddings.create(
                model=self.model,
                input=batch
            )
            
            batch_embeddings = [item.embedding for item in response.data]
            all_embeddings.extend(batch_embeddings)
            
            # Rate limiting
            if i + self.batch_size < len(texts):
                time.sleep(self.rate_limit_delay)
                
        return all_embeddings
