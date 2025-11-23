
import requests
import os
import sys

def test_document_parser():
    # Create a dummy PDF file for testing if it doesn't exist
    filename = "sample_rfp.pdf"
    if not os.path.exists(filename):
        with open(filename, "wb") as f:
            f.write(b"%PDF-1.4\n%Test PDF content")
            
    try:
        with open(filename, "rb") as f:
            response = requests.post("http://localhost:8000/parse", files={"file": f})
            
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"Error Response: {response.text}")
            
        assert response.status_code == 200
        json_response = response.json()
        assert "sections" in json_response
        assert "metadata" in json_response
        
        print("SUCCESS: Test passed! 'sections' and 'metadata' found in response.")
        
    except Exception as e:
        print(f"FAILURE: {str(e)}")
    finally:
        # Clean up
        if os.path.exists(filename):
            os.remove(filename)

if __name__ == "__main__":
    test_document_parser()
