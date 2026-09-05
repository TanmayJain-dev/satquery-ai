"""
classifier.py
-------------
Agentic query understanding and task router. Analyzes the natural language query
and image modalities to determine the execution pipeline.
"""

from typing import Dict, Any, List

def classify_query(query: str, image_count: int) -> Dict[str, Any]:
    """
    Classifies the user query and image inputs into an agentic task plan.
    """
    q = query.strip().lower()
    
    # 1. Cross-Modal Optical + SAR
    if "sar" in q or "radar" in q or "fusion" in q or "cloud" in q or (image_count == 2 and ("optical" in q or "sar" in q)):
        task = "OPTICAL_SAR_FUSION"
        target = "water_and_builtup"
        description = "Co-registered Optical and SAR Fusion Analysis"
        tool_name = "optical_sar_fusion_tool"
        expected_images = 2
        
    # 2. Bi-Temporal Change Analysis & Change VQA
    elif any(k in q for k in ["change", "dates", "difference", "increased", "decreased", "between", "expansion", "before and after"]) or image_count == 2:
        if any(k in q for k in ["increase", "decrease", "has the", "how much", "percentage", "rate"]):
            task = "CHANGE_VQA"
            target = "built_up_change"
            description = "Bi-Temporal Quantitative Change Visual Question Answering"
            tool_name = "change_vqa_tool"
        else:
            task = "TEMPORAL_CHANGE"
            target = "spatial_difference"
            description = "Bi-Temporal Spatial Change Detection & Heatmap Mapping"
            tool_name = "change_detection_tool"
        expected_images = 2
        
    # 3. Text-guided Visual Grounding
    elif any(k in q for k in ["highlight", "locate", "ground", "find", "bounding box", "detect", "point out", "segment"]):
        task = "GROUNDING"
        if "water" in q or "lake" in q or "river" in q or "ocean" in q or "pond" in q:
            target = "water"
        elif "runway" in q or "airport" in q or "flight" in q or "tarmac" in q:
            target = "runway"
        elif "urban" in q or "building" in q or "structure" in q or "settlement" in q:
            target = "building"
        elif "crop" in q or "farm" in q or "field" in q:
            target = "agriculture"
        else:
            target = "general_objects"
        description = f"Text-Guided Spatial Grounding ({target})"
        tool_name = "grounding_tool"
        expected_images = 1
        
    # 4. Single-Image VQA & Scene Understanding (Default)
    else:
        task = "SINGLE_VQA"
        target = "land_cover"
        description = "Single-Image Remote Sensing Visual Question Answering & Land-Cover Assessment"
        tool_name = "single_vqa_tool"
        expected_images = 1
        
    return {
        "task": task,
        "target": target,
        "description": description,
        "tool_name": tool_name,
        "expected_images": expected_images,
        "confidence_prior": 0.94
    }
