"""
analyze.py
----------
Primary analysis endpoint for SatQuery AI. Accepts multipart images or
file streams along with the natural language query.
"""

from typing import List, Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from ..geospatial.raster_io import load_raster
from ..agent.router import execute_agent_pipeline

router = APIRouter()

@router.post("/analyze")
async def analyze_endpoint(
    query: str = Form(...),
    files: List[UploadFile] = File(...)
):
    """
    Unified analysis endpoint executing the agentic remote sensing pipeline.
    """
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query string cannot be empty.")
    if not files:
        raise HTTPException(status_code=400, detail="At least one satellite image file must be uploaded.")
        
    images = []
    metadata_list = []
    
    for file in files:
        contents = await file.read()
        try:
            arr, meta = load_raster(contents)
            images.append(arr)
            metadata_list.append(meta)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read image '{file.filename}': {str(e)}")
            
    try:
        result = execute_agent_pipeline(query, images, metadata_list)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline execution error: {str(e)}")
