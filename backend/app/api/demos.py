"""
demos.py
--------
Pre-packaged SIH26167 evaluation demo scenarios for 1-click execution.
"""

from typing import List, Dict, Any
from pathlib import Path
from fastapi import APIRouter, HTTPException
from ..config import settings
from ..geospatial.raster_io import load_raster
from ..agent.router import execute_agent_pipeline

router = APIRouter()

DEMO_SCENARIOS = [
    {
        "id": "demo-1",
        "title": "Demo 1: Single-Image VQA",
        "subtitle": "Land Cover Classification & Scene Understanding",
        "query": "Describe the land-cover and major objects visible in this image.",
        "modality": "Single Optical",
        "files": ["optical_single.png"],
        "tag": "VQA"
    },
    {
        "id": "demo-2",
        "title": "Demo 2: Text Grounding",
        "subtitle": "Spatial Bounding Box Localization & Object Referencing",
        "query": "Highlight the water bodies and lake reservoirs in this scene.",
        "modality": "Single Optical",
        "files": ["grounding_scene.png"],
        "tag": "Grounding"
    },
    {
        "id": "demo-3",
        "title": "Demo 3: Temporal Change",
        "subtitle": "Bi-Temporal Surface Difference & Heatmap Mapping",
        "query": "What changed between these two dates, and where did the change occur?",
        "modality": "Bi-Temporal Pair (T1 & T2)",
        "files": ["temporal_t1.png", "temporal_t2.png"],
        "tag": "Change Detection"
    },
    {
        "id": "demo-4",
        "title": "Demo 4: Change VQA",
        "subtitle": "Quantitative Transformation Assessment",
        "query": "Has the built-up area increased, decreased, or remained unchanged?",
        "modality": "Bi-Temporal Pair (T1 & T2)",
        "files": ["temporal_t1.png", "temporal_t2.png"],
        "tag": "Change VQA"
    },
    {
        "id": "demo-5",
        "title": "Demo 5: Optical + SAR Fusion",
        "subtitle": "Cross-Modal Cloud Penetration & Feature Extraction",
        "query": "Use the optical and SAR images together to identify built-up and water-covered regions.",
        "modality": "Co-registered Optical + SAR",
        "files": ["optical_fusion.png", "sar_fusion.png"],
        "tag": "Sensor Fusion"
    }
]

@router.get("/demos")
async def list_demos():
    """Returns the list of 5 mandatory SIH evaluation scenarios."""
    return {"demos": DEMO_SCENARIOS}

@router.post("/demos/run/{demo_id}")
async def run_demo_scenario(demo_id: str):
    """Executes a specific pre-packaged demo scenario using bundled sample imagery."""
    scenario = next((d for d in DEMO_SCENARIOS if d["id"] == demo_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Demo scenario '{demo_id}' not found.")
        
    images = []
    metadata_list = []
    
    for fname in scenario["files"]:
        fpath = settings.SAMPLES_DIR / fname
        if not fpath.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Sample file '{fname}' not found at {fpath}. Please run generate_samples.py first."
            )
        arr, meta = load_raster(fpath)
        images.append(arr)
        metadata_list.append(meta)
        
    result = execute_agent_pipeline(scenario["query"], images, metadata_list)
    result["scenario_meta"] = scenario
    return result
