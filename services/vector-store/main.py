import os
from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from models import (
    UpsertRequest, UpsertResponse,
    SearchRequest, SearchResponse, SearchResult,
    PatternResponse
)
from vector_store import VectorStore
from pattern_extractor import PatternExtractor

# Load environment variables
load_dotenv()

app = FastAPI(title="Deal Velocity Vector Store")

# Initialize services
vector_store = VectorStore()
pattern_extractor = PatternExtractor()

@app.on_event("startup")
async def startup_event():
    """Check Pinecone index connection on startup."""
    try:
        stats = vector_store.get_stats()
        print(f"Connected to Pinecone index with {stats['total_vector_count']} vectors")
    except Exception as e:
        print(f"Warning: Could not connect to Pinecone index: {str(e)}")
        print("Create index with: pc index create -n deal-velocity -m cosine -c aws -r us-east-1 --model llama-text-embed-v2 --field_map text=content")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/upsert", response_model=UpsertResponse)
async def upsert_documents(request: UpsertRequest):
    """Upload documents to Pinecone.
    
    Uses Pinecone's integrated embeddings - no need to generate embeddings manually.
    """
    try:
        # Convert documents to Pinecone format
        pinecone_docs = [
            {
                "_id": doc.id,
                "content": doc.text,  # Must match field_map in index creation
                **doc.metadata  # Flat metadata only, no nested objects
            }
            for doc in request.documents
        ]
        
        # Upsert with namespace (required for data isolation)
        result = vector_store.upsert_documents(
            namespace=request.namespace or "default",
            documents=pinecone_docs
        )
        
        return UpsertResponse(upserted=result["upserted"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search", response_model=SearchResponse)
async def search_documents(request: SearchRequest):
    """Perform semantic search with integrated embeddings and reranking."""
    try:
        results = vector_store.search(
            namespace=request.namespace or "default",
            query_text=request.query,
            top_k=request.top_k,
            filter=request.filter,
            rerank=True  # Always rerank for production
        )
        
        search_results = [
            SearchResult(
                id=r["id"],
                score=r["score"],
                metadata=r.get("fields", {})
            )
            for r in results
        ]
        
        return SearchResponse(
            results=search_results,
            query=request.query,
            count=len(search_results)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/similar/{doc_id}", response_model=SearchResponse)
async def find_similar(
    doc_id: str,
    top_k: int = 10,
    namespace: str = "default"
):
    """Find documents similar to a given document."""
    try:
        # Fetch the document
        docs = vector_store.fetch(namespace=namespace, ids=[doc_id])
        
        if not docs or doc_id not in docs:
            raise HTTPException(status_code=404, detail="Document not found")
        
        doc = docs[doc_id]
        
        # Use the document's content to search
        # This works because Pinecone will embed it and find similar vectors
        content = doc.get("fields", {}).get("content", "")
        if not content:
            raise HTTPException(status_code=400, detail="Document has no content field")
        
        results = vector_store.search(
            namespace=namespace,
            query_text=content,
            top_k=top_k + 1,  # +1 to exclude self
            rerank=True
        )
        
        # Filter out the query document itself
        results = [r for r in results if r["id"] != doc_id][:top_k]
        
        search_results = [
            SearchResult(
                id=r["id"],
                score=r["score"],
                metadata=r.get("fields", {})
            )
            for r in results
        ]
        
        return SearchResponse(
            results=search_results,
            query=f"Similar to {doc_id}",
            count=len(search_results)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/patterns", response_model=PatternResponse)
async def extract_patterns(request: SearchRequest):
    """Extract patterns from search results."""
    try:
        # Perform search
        results = vector_store.search(
            namespace=request.namespace or "default",
            query_text=request.query,
            top_k=request.top_k,
            filter=request.filter,
            rerank=True
        )
        
        # Extract patterns
        patterns = pattern_extractor.extract_patterns(results)
        
        return PatternResponse(**patterns)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
async def get_stats():
    """Get index statistics."""
    try:
        stats = vector_store.get_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
