from typing import List, Dict, Any
from collections import defaultdict, Counter

class PatternExtractor:
    @staticmethod
    def extract_patterns(results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Extract patterns from search results.
        
        Args:
            results: List of search results with metadata
        
        Returns:
            Dictionary containing extracted patterns
        """
        if not results:
            return {
                "total_results": 0,
                "metadata_patterns": {},
                "common_themes": [],
                "score_statistics": {}
            }
        
        # Collect all metadata fields
        metadata_values = defaultdict(list)
        scores = []
        
        for result in results:
            metadata = result.get("metadata", {})
            
            for key, value in metadata.items():
                if value is not None:
                    metadata_values[key].append(value)
            
            if "score" in result:
                scores.append(result["score"])
            if "combined_score" in result:
                scores.append(result["combined_score"])
        
        # Extract patterns from metadata
        patterns = {}
        for field, values in metadata_values.items():
            if isinstance(values[0], (str, int, float, bool)):
                # Count occurrences
                counter = Counter(values)
                patterns[field] = {
                    "most_common": counter.most_common(5),
                    "unique_count": len(counter),
                    "total_count": len(values)
                }
        
        # Calculate score statistics
        score_stats = {}
        if scores:
            score_stats = {
                "mean": sum(scores) / len(scores),
                "min": min(scores),
                "max": max(scores),
                "count": len(scores)
            }
        
        # Extract common themes (top metadata values)
        common_themes = []
        for field, pattern_data in patterns.items():
            if pattern_data["unique_count"] < len(results):
                # Field with repeated values indicates a theme
                common_themes.append({
                    "field": field,
                    "top_values": pattern_data["most_common"][:3]
                })
        
        return {
            "total_results": len(results),
            "metadata_patterns": patterns,
            "common_themes": common_themes,
            "score_statistics": score_stats
        }
    
    @staticmethod
    def extract_document_patterns(
        doc_id: str,
        similar_docs: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Extract patterns specific to a document and its similar documents.
        
        Args:
            doc_id: The reference document ID
            similar_docs: List of similar documents
        
        Returns:
            Pattern analysis for the document
        """
        patterns = PatternExtractor.extract_patterns(similar_docs)
        
        return {
            "document_id": doc_id,
            "similar_count": len(similar_docs),
            **patterns
        }
