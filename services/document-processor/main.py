
from fastapi import FastAPI, UploadFile, File, HTTPException
from models import ProcessResponse
from processor import process_document

app = FastAPI(title="Deal Velocity Document Processor")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/parse", response_model=ProcessResponse)
async def parse_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    try:
        content = await file.read()
        metadata, chunks, full_text = await process_document(content, file.filename)
        
        return ProcessResponse(
            metadata=metadata,
            sections=chunks,
            full_text=full_text
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
from redline_generator import create_redlined_document
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List

class RedlineRequest(BaseModel):
    original_text: str
    changes: List[dict] # [{'original': '...', 'new': '...'}]

@app.post("/redline")
async def generate_redline(request: RedlineRequest):
    try:
        file_stream = create_redlined_document(request.original_text, request.changes)
        return StreamingResponse(
            file_stream, 
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": "attachment; filename=redlined_contract.docx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
