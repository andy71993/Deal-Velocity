import os
from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from models import (
    EmbedRequest, EmbedResponse,
    UpsertRequest, UpsertResponse,
    SearchRequest, SearchResponse, SearchResult,
    PatternResponse
)
from embeddings import EmbeddingService
from vector_store import VectorStore
from hybrid_search import HybridSearch
from pattern_extractor import PatternExtractor

# Load environment variables
load_dotenv()

app = FastAPI(title="Deal Velocity Vector Store")

# Initialize services
embedding_service = EmbeddingService()
vector_store = VectorStore()
hybrid_search = HybridSearch(vector_store, embedding_service)
pattern_extractor = PatternExtractor()

@app.on_event("startup")
async def startup_event():
    """Initialize Pinecone index on startup."""
    try:
        vector_store.initialize_index()
    except Exception as e:
        print(f"Warning: Could not initialize Pinecone index: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/embed", response_model=EmbedResponse)
async def embed_text(request: EmbedRequest):
    """Generate embedding for text."""
    try:
        embedding = embedding_service.generate_embedding(request.text)
        return EmbedResponse(
            embedding=embedding,
            dimension=len(embedding)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upsert", response_model=UpsertResponse)
async def upsert_documents(request: UpsertRequest):
    """Upload documents with embeddings to Pinecone."""
    try:
        # Generate embeddings for all documents
        texts = [doc.text for doc in request.documents]
        embeddings = embedding_service.generate_embeddings_batch(texts)
        
        # Format documents for Pinecone
        pinecone_docs = [
            {
                "id": doc.id,
                "values": embedding,
                "metadata": {
                    **doc.metadata,
                    "text": doc.text[:1000]  # Store truncated text in metadata
                }
            }
            for doc, embedding in zip(request.documents, embeddings)
        ]
        
        # Upsert to Pinecone
        result = vector_store.upsert_documents(
            pinecone_docs,
            namespace=request.namespace
        )
        
        return UpsertResponse(upserted=result["upserted"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search", response_model=SearchResponse)
async def search_documents(request: SearchRequest):
    """Perform hybrid search on documents."""
    try:
        results = hybrid_search.search(
            query=request.query,
            top_k=request.top_k,
            keyword_filter=request.filter,
            namespace=request.namespace,
            alpha=request.alpha
        )
        
        search_results = [
            SearchResult(
                id=r["id"],
                score=r.get("score", 0.0),
                semantic_score=r.get("semantic_score"),
                keyword_score=r.get("keyword_score"),
                combined_score=r.get("combined_score"),
                metadata=r.get("metadata", {})
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
    namespace: str = ""
):
    """Find documents similar to a given document."""
    try:
        # Fetch the document
        doc = vector_store.get_by_id(doc_id, namespace=namespace)
        
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Search using the document's vector
        results = vector_store.search(
            query_vector=doc["values"],
            top_k=top_k + 1,  # +1 to exclude self
            namespace=namespace
        )
        
        # Filter out the query document itself
        results = [r for r in results if r["id"] != doc_id][:top_k]
        
        search_results = [
            SearchResult(
                id=r["id"],
                score=r["score"],
                metadata=r.get("metadata", {})
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
        results = hybrid_search.search(
            query=request.query,
            top_k=request.top_k,
            keyword_filter=request.filter,
            namespace=request.namespace,
            alpha=request.alpha
        )
        
        # Extract patterns
        patterns = pattern_extractor.extract_patterns(results)
        
        return PatternResponse(**patterns)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
