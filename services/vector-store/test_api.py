import requests
import json
import os

BASE_URL = "http://localhost:8001"

def test_health():
    """Test health endpoint."""
    response = requests.get(f"{BASE_URL}/health")
    print(f"Health Check: {response.status_code}")
    print(f"Response: {response.json()}\n")
    assert response.status_code == 200

def test_embed():
    """Test embedding generation."""
    data = {"text": "This is a test document about RFP responses."}
    response = requests.post(f"{BASE_URL}/embed", json=data)
    print(f"Embed: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Embedding dimension: {result['dimension']}")
        print(f"First 5 values: {result['embedding'][:5]}\n")
    else:
        print(f"Error: {response.text}\n")

def test_upsert():
    """Test document upload."""
    data = {
        "documents": [
            {
                "id": "doc1",
                "text": "RFP response for cloud infrastructure project",
                "metadata": {"type": "RFP", "category": "infrastructure"}
            },
            {
                "id": "doc2",
                "text": "Contract agreement for software development",
                "metadata": {"type": "Contract", "category": "software"}
            }
        ],
        "namespace": ""
    }
    response = requests.post(f"{BASE_URL}/upsert", json=data)
    print(f"Upsert: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {response.json()}\n")
    else:
        print(f"Error: {response.text}\n")

def test_search():
    """Test hybrid search."""
    data = {
        "query": "cloud infrastructure RFP",
        "top_k": 5,
        "alpha": 0.7
    }
    response = requests.post(f"{BASE_URL}/search", json=data)
    print(f"Search: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Found {result['count']} results")
        for r in result['results']:
            print(f"  - {r['id']}: score={r.get('combined_score', r['score']):.4f}")
        print()
    else:
        print(f"Error: {response.text}\n")

def test_patterns():
    """Test pattern extraction."""
    data = {
        "query": "RFP and contracts",
        "top_k": 10
    }
    response = requests.post(f"{BASE_URL}/patterns", json=data)
    print(f"Patterns: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Total results: {result['total_results']}")
        print(f"Common themes: {len(result['common_themes'])}")
        print(f"Score stats: {result.get('score_statistics', {})}\n")
    else:
        print(f"Error: {response.text}\n")

if __name__ == "__main__":
    print("Testing Vector Store API\n")
    print("=" * 50 + "\n")
    
    try:
        test_health()
        test_embed()
        test_upsert()
        test_search()
        test_patterns()
        
        print("=" * 50)
        print("All tests completed!")
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to service. Make sure it's running on port 8001.")
    except Exception as e:
        print(f"ERROR: {str(e)}")
