
import re
from typing import List, Tuple, Dict, Any
from unstructured.partition.auto import partition
from unstructured.chunking.title import chunk_by_title
from models import DocumentChunk, DocumentMetadata

def extract_dates(text: str) -> List[str]:
    # Simple regex for dates (YYYY-MM-DD, MM/DD/YYYY, etc.)
    date_pattern = r'\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}/\d{1,2}/\d{2,4})\b'
    return list(set(re.findall(date_pattern, text)))

def extract_values(text: str) -> List[str]:
    # Regex for currency values ($1,000.00, etc.)
    value_pattern = r'\$\s?[\d,]+(?:\.\d{2})?'
    return list(set(re.findall(value_pattern, text)))

def identify_doc_type(text: str) -> str:
    text_lower = text.lower()[:1000]  # Check first 1000 chars
    if 'rfp' in text_lower or 'request for proposal' in text_lower:
        return 'RFP'
    elif 'contract' in text_lower or 'agreement' in text_lower:
        return 'Contract'
    elif 'invoice' in text_lower:
        return 'Invoice'
    return 'Unknown'

async def process_document(file_content: bytes, filename: str) -> Tuple[DocumentMetadata, List[DocumentChunk], str]:
    from io import BytesIO
    
    # 1. Partition the document
    elements = partition(file=BytesIO(file_content), metadata_filename=filename)
    
    # 2. Extract full text
    full_text = "\n\n".join([str(el) for el in elements])
    
    # 3. Chunking
    chunks = chunk_by_title(elements)
    doc_chunks = []
    for chunk in chunks:
        doc_chunks.append(DocumentChunk(
            text=str(chunk),
            metadata=chunk.metadata.to_dict()
        ))
    
    # 4. Metadata Extraction
    doc_type = identify_doc_type(full_text)
    dates = extract_dates(full_text)
    values = extract_values(full_text)
    page_count = elements[-1].metadata.page_number if elements and hasattr(elements[-1].metadata, 'page_number') else 1

    metadata = DocumentMetadata(
        filename=filename,
        file_type=filename.split('.')[-1],
        doc_type=doc_type,
        extracted_dates=dates,
        extracted_values=values,
        page_count=page_count or 1
    )

    return metadata, doc_chunks, full_text
