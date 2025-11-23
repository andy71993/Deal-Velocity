from pydantic import BaseModel
from typing import List, Dict, Any, Optional

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
    namespace: str = "default"

class SearchResult(BaseModel):
    id: str
    score: float
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
