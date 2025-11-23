import os
from typing import List, Dict, Any, Optional
from pinecone import Pinecone
import time

class VectorStore:
    def __init__(
        self,
        api_key: str = None,
        index_name: str = "deal-velocity"
    ):
        self.api_key = api_key or os.getenv("PINECONE_API_KEY")
        if not self.api_key:
            raise ValueError("PINECONE_API_KEY environment variable not set")
        
        self.pc = Pinecone(api_key=self.api_key)
        self.index_name = index_name
        self.index = None
        
    def get_index(self):
        """Get or initialize index connection."""
        if not self.index:
            if not self.pc.has_index(self.index_name):
                raise ValueError(
                    f"Index '{self.index_name}' does not exist. "
                    f"Create it using Pinecone CLI: "
                    f"pc index create -n {self.index_name} -m cosine -c aws -r us-east-1 "
                    f"--model llama-text-embed-v2 --field_map text=content"
                )
            self.index = self.pc.Index(self.index_name)
        return self.index
    
    def upsert_documents(
        self,
        namespace: str,
        documents: List[Dict[str, Any]],
        batch_size: int = 96  # Pinecone limit for text records
    ) -> Dict[str, int]:
        """Batch upsert documents using upsert_records().
        
        Each document should have:
        - _id: unique identifier  
        - content: text field (must match index field_map)
        - Other fields: flat metadata (no nested objects)
        """
        if not namespace:
            raise ValueError("Namespace is required for data isolation")
        
        index = self.get_index()
        upserted_count = 0
        
        # Process in batches (max 96 for text records, 2MB total)
        for i in range(0, len(documents), batch_size):
            batch = documents[i:i + batch_size]
            index.upsert_records(namespace, batch)
            upserted_count += len(batch)
            time.sleep(0.1)  # Rate limiting
            
        return {"upserted": upserted_count}
    
    def search(
        self,
        namespace: str,
        query_text: str,
        top_k: int = 10,
        filter: Optional[Dict[str, Any]] = None,
        rerank: bool = True
    ) -> List[Dict[str, Any]]:
        """Search using the new search() API with integrated embeddings.
        
        Always uses reranking for production-quality results.
        """
        if not namespace:
            raise ValueError("Namespace is required for data isolation")
        
        index = self.get_index()
        
        # Build query dict
        query_dict = {
            "top_k": top_k * 2 if rerank else top_k,  # Get more for reranking
            "inputs": {"text": query_text}
        }
        
        # Only add filter if it exists (don't set to None)
        if filter:
            query_dict["filter"] = filter
        
        # Build search params
        search_params = {
            "namespace": namespace,
            "query": query_dict
        }
        
        # Add reranking if enabled (recommended for production)
        if rerank:
            search_params["rerank"] = {
                "model": "bge-reranker-v2-m3",
                "top_n": top_k,
                "rank_fields": ["content"]
            }
        
        results = index.search(**search_params)
        
        # Parse results - with reranking, use dict-style access
        parsed_results = []
        for hit in results.result.hits:
            parsed_results.append({
                "id": hit["_id"],
                "score": hit["_score"],
                "fields": hit.get("fields", {}),
                "metadata": hit.get("fields", {})  # Fields contain metadata
            })
        
        return parsed_results
    
    def fetch(
        self,
        namespace: str,
        ids: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        """Fetch records by IDs."""
        if not namespace:
            raise ValueError("Namespace is required")
        
        index = self.get_index()
        result = index.fetch(namespace=namespace, ids=ids)
        
        # Convert to dict format
        records = {}
        if result.records:
            for record_id, record in result.records.items():
                records[record_id] = {
                    "id": record_id,
                    "fields": record.fields if hasattr(record, 'fields') else {}
                }
        
        return records
    
    def list_ids(
        self,
        namespace: str,
        prefix: Optional[str] = None,
        limit: int = 1000
    ) -> List[str]:
        """List record IDs with optional prefix filter."""
        if not namespace:
            raise ValueError("Namespace is required")
        
        index = self.get_index()
        all_ids = []
        pagination_token = None
        
        while True:
            result = index.list(
                namespace=namespace,
                prefix=prefix,
                limit=limit,
                pagination_token=pagination_token
            )
            
            all_ids.extend([record.id for record in result.records])
            
            if not result.pagination or not result.pagination.next:
                break
            pagination_token = result.pagination.next
        
        return all_ids
    
    def delete(
        self,
        namespace: str,
        ids: Optional[List[str]] = None,
        delete_all: bool = False
    ) -> Dict[str, Any]:
        """Delete records by IDs or entire namespace."""
        if not namespace:
            raise ValueError("Namespace is required")
        
        index = self.get_index()
        
        if delete_all:
            index.delete(namespace=namespace, delete_all=True)
            return {"deleted": "all"}
        elif ids:
            index.delete(namespace=namespace, ids=ids)
            return {"deleted": len(ids)}
        else:
            raise ValueError("Must provide either ids or delete_all=True")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get index statistics."""
        index = self.get_index()
        stats = index.describe_index_stats()
        
        return {
            "total_vector_count": stats.total_vector_count,
            "namespaces": list(stats.namespaces.keys()) if stats.namespaces else []
        }
