import os
from typing import List, Dict, Any, Optional
from pinecone import Pinecone, ServerlessSpec
import time

class VectorStore:
    def __init__(
        self,
        api_key: str = None,
        environment: str = None,
        index_name: str = "deal-velocity"
    ):
        self.pc = Pinecone(api_key=api_key or os.getenv("PINECONE_API_KEY"))
        self.environment = environment or os.getenv("PINECONE_ENVIRONMENT", "us-east-1-aws")
        self.index_name = index_name
        self.dimension = 1536  # text-embedding-3-small dimension
        self.index = None
        
    def initialize_index(self):
        """Initialize or connect to Pinecone index."""
        # Check if index exists
        existing_indexes = [idx.name for idx in self.pc.list_indexes()]
        
        if self.index_name not in existing_indexes:
            # Create index
            self.pc.create_index(
                name=self.index_name,
                dimension=self.dimension,
                metric="cosine",
                spec=ServerlessSpec(
                    cloud="aws",
                    region=self.environment
                )
            )
            # Wait for index to be ready
            time.sleep(1)
        
        self.index = self.pc.Index(self.index_name)
        return self.index
    
    def upsert_documents(
        self,
        documents: List[Dict[str, Any]],
        namespace: str = ""
    ) -> Dict[str, int]:
        """Batch upsert documents to Pinecone.
        
        Each document should have:
        - id: unique identifier
        - values: embedding vector
        - metadata: dict of metadata fields
        """
        if not self.index:
            self.initialize_index()
        
        batch_size = 100
        upserted_count = 0
        
        for i in range(0, len(documents), batch_size):
            batch = documents[i:i + batch_size]
            
            # Format for Pinecone
            vectors = [
                {
                    "id": doc["id"],
                    "values": doc["values"],
                    "metadata": doc.get("metadata", {})
                }
                for doc in batch
            ]
            
            self.index.upsert(vectors=vectors, namespace=namespace)
            upserted_count += len(batch)
            
        return {"upserted": upserted_count}
    
    def search(
        self,
        query_vector: List[float],
        top_k: int = 10,
        filter: Optional[Dict[str, Any]] = None,
        namespace: str = "",
        include_metadata: bool = True
    ) -> List[Dict[str, Any]]:
        """Search for similar vectors."""
        if not self.index:
            self.initialize_index()
        
        results = self.index.query(
            vector=query_vector,
            top_k=top_k,
            filter=filter,
            namespace=namespace,
            include_metadata=include_metadata
        )
        
        return [
            {
                "id": match.id,
                "score": match.score,
                "metadata": match.metadata if include_metadata else {}
            }
            for match in results.matches
        ]
    
    def get_by_id(
        self,
        doc_id: str,
        namespace: str = ""
    ) -> Optional[Dict[str, Any]]:
        """Fetch a document by ID."""
        if not self.index:
            self.initialize_index()
        
        result = self.index.fetch(ids=[doc_id], namespace=namespace)
        
        if doc_id in result.vectors:
            vec = result.vectors[doc_id]
            return {
                "id": vec.id,
                "values": vec.values,
                "metadata": vec.metadata
            }
        return None
    
    def delete(
        self,
        ids: List[str],
        namespace: str = ""
    ) -> Dict[str, Any]:
        """Delete documents by IDs."""
        if not self.index:
            self.initialize_index()
        
        self.index.delete(ids=ids, namespace=namespace)
        return {"deleted": len(ids)}
