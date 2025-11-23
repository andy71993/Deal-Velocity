from typing import List, Dict, Any, Optional
from collections import defaultdict

class HybridSearch:
    def __init__(self, vector_store, embedding_service):
        self.vector_store = vector_store
        self.embedding_service = embedding_service
        
    def search(
        self,
        query: str,
        top_k: int = 10,
        keyword_filter: Optional[Dict[str, Any]] = None,
        namespace: str = "",
        alpha: float = 0.7  # Weight for semantic search (0-1)
    ) -> List[Dict[str, Any]]:
        """
        Perform hybrid search combining semantic and keyword matching.
        
        Args:
            query: Search query text
            top_k: Number of results to return
            keyword_filter: Metadata filters for keyword matching
            namespace: Pinecone namespace
            alpha: Weight for semantic search (1-alpha for keyword)
        
        Returns:
            List of search results with combined scores
        """
        # Generate query embedding for semantic search
        query_embedding = self.embedding_service.generate_embedding(query)
        
        # Perform semantic search
        semantic_results = self.vector_store.search(
            query_vector=query_embedding,
            top_k=top_k * 2,  # Get more results for fusion
            filter=keyword_filter,
            namespace=namespace
        )
        
        # Normalize and combine scores
        results_map = {}
        
        for idx, result in enumerate(semantic_results):
            doc_id = result["id"]
            # Normalize semantic score (cosine similarity is already 0-1)
            semantic_score = result["score"]
            
            # Keyword score based on metadata matching
            keyword_score = self._calculate_keyword_score(
                result.get("metadata", {}),
                keyword_filter or {}
            )
            
            # Combined score
            combined_score = (alpha * semantic_score) + ((1 - alpha) * keyword_score)
            
            results_map[doc_id] = {
                **result,
                "semantic_score": semantic_score,
                "keyword_score": keyword_score,
                "combined_score": combined_score
            }
        
        # Sort by combined score and return top_k
        sorted_results = sorted(
            results_map.values(),
            key=lambda x: x["combined_score"],
            reverse=True
        )
        
        return sorted_results[:top_k]
    
    def _calculate_keyword_score(
        self,
        metadata: Dict[str, Any],
        filters: Dict[str, Any]
    ) -> float:
        """Calculate keyword matching score based on metadata."""
        if not filters:
            return 0.5  # Neutral score if no filters
        
        matches = 0
        total = len(filters)
        
        for key, value in filters.items():
            if key in metadata:
                if isinstance(value, list):
                    # Check if any value matches
                    if metadata[key] in value:
                        matches += 1
                elif metadata[key] == value:
                    matches += 1
        
        return matches / total if total > 0 else 0.5
