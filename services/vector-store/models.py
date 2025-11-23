from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class EmbedRequest(BaseModel):
    text: str

class EmbedResponse(BaseModel):
    embedding: List[float]
    dimension: int

class Document(BaseModel):
    id: str
    text: str
    metadata: Dict[str, Any] = {}

class UpsertRequest(BaseModel):
    documents: List[Document]
    namespace: str = ""

class UpsertResponse(BaseModel):
    upserted: int

class SearchRequest(BaseModel):
    query: str
    top_k: int = 10
    filter: Optional[Dict[str, Any]] = None
    namespace: str = ""
    alpha: float = 0.7  # Weight for semantic vs keyword

class SearchResult(BaseModel):
    id: str
    score: float
    semantic_score: Optional[float] = None
    keyword_score: Optional[float] = None
    combined_score: Optional[float] = None
    metadata: Dict[str, Any] = {}

class SearchResponse(BaseModel):
    results: List[SearchResult]
    query: str
    count: int

class PatternResponse(BaseModel):
    total_results: int
    metadata_patterns: Dict[str, Any]
    common_themes: List[Dict[str, Any]]
    score_statistics: Dict[str, Any]
