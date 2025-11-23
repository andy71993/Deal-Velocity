
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class DocumentChunk(BaseModel):
    text: str
    metadata: Dict[str, Any]

class DocumentMetadata(BaseModel):
    filename: str
    file_type: str
    doc_type: str  # RFP, Contract, etc.
    extracted_dates: List[str]
    extracted_values: List[str]
    page_count: int

class ProcessResponse(BaseModel):
    metadata: DocumentMetadata
    sections: List[DocumentChunk]
    full_text: str
