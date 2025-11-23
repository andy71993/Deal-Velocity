# Vector Store Service

Pinecone-based vector store with integrated embeddings for the Deal Velocity platform.

## Setup

### 1. Install Pinecone CLI

**macOS:**
```bash
brew tap pinecone-io/tap
brew install pinecone-io/tap/pinecone
```

**Other platforms:**
Download from [GitHub Releases](https://github.com/pinecone-io/cli/releases)

### 2. Configure Pinecone

```bash
# Set your API key
export PINECONE_API_KEY="your-api-key-here"

# Configure CLI
pc auth configure --api-key $PINECONE_API_KEY
```

### 3. Create Index

```bash
# Create index with integrated Llama embeddings
pc index create -n deal-velocity \
  -m cosine \
  -c aws \
  -r us-east-1 \
  --model llama-text-embed-v2 \
  --field_map text=content
```

This creates an index that:
- Automatically generates embeddings from text
- Uses the `content` field for embedding
- Stores data in `us-east-1` AWS region

### 4. Install Python Dependencies

```bash
cd services/vector-store
pip install -r requirements.txt
```

### 5. Set Environment Variables

Add to `.env.local`:
```
PINECONE_API_KEY=your-api-key-here
```

## Running the Service

**Direct Python:**
```bash
cd services/vector-store
uvicorn main:app --host 0.0.0.0 --port 8001
```

**Docker:**
```bash
docker-compose up vector-store
```

## API Endpoints

### Upload Documents
```bash
curl -X POST http://localhost:8001/upsert \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "id": "doc1",
        "text": "Your document content here",
        "metadata": {"category": "rfp", "date": "2025-01-01"}
      }
    ],
    "namespace": "my-namespace"
  }'
```

### Search
```bash
curl -X POST http://localhost:8001/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "search query",
    "top_k": 10,
    "namespace": "my-namespace"
  }'
```

### Find Similar Documents
```bash
curl http://localhost:8001/similar/doc1?namespace=my-namespace
```

### Get Index Stats
```bash
curl http://localhost:8001/stats
```

## Key Features

- **Integrated Embeddings**: Pinecone automatically generates embeddings using `llama-text-embed-v2`
- **Automatic Reranking**: Uses `bge-reranker-v2-m3` for improved result quality
- **Namespace Isolation**: Each namespace is isolated for multi-tenant support
- **Metadata Filtering**: Filter results by metadata fields
- **Pattern Extraction**: Analyze search results for common themes

## Best Practices

1. **Always use namespaces** for data isolation (e.g., `user_123`, `session_456`)
2. **Flat metadata only** - no nested objects (40KB limit per record)
3. **Batch size**: Max 96 records per batch for text, 2MB total
4. **Use CLI for admin tasks** (create/delete indexes), SDK for data operations
5. **Reranking always enabled** for production-quality search results

## Troubleshooting

- **"Index does not exist"**: Create it with `pc index create` command above
- **"PINECONE_API_KEY not set"**: Add to `.env.local` file
- **"Nested metadata error"**: Flatten all metadata fields
- **"Batch too large"**: Reduce to 96 records or less

## References

- [Pinecone Documentation](https://docs.pinecone.io/)
- [Python SDK](https://sdk.pinecone.io/python/index.html)
- [CLI Reference](https://docs.pinecone.io/reference/cli/command-reference)
