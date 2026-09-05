"""
router.py
---------
Agentic Router: Central orchestrator connecting input validation,
query classification, tool execution, and evidence compilation.
"""

import uuid
from typing import List, Dict, Any
import numpy as np

from .classifier import classify_query
from .trace import AgentTrace
from ..geospatial.validation import validate_inputs
from ..tools.vqa import run_single_vqa
from ..tools.grounding import run_grounding
from ..tools.change_detection import run_change_analysis
from ..tools.optical_sar import run_optical_sar_fusion
from ..evidence.confidence import compute_confidence
from ..evidence.report_generator import generate_evidence_report

def execute_agent_pipeline(
    query: str,
    images: List[np.ndarray],
    metadata_list: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Executes the 5-stage agentic remote sensing pipeline.
    """
    session_id = str(uuid.uuid4())
    trace = AgentTrace()
    trace.add_step("INGEST", f"Ingested {len(images)} raster stream(s) for query: '{query}'")
    
    # Stage 1: Query Classification
    plan = classify_query(query, len(images))
    trace.add_step(
        "CLASSIFY",
        f"Classified intent as {plan['task']} ({plan['description']}). Selected tool: {plan['tool_name']}",
        {"expected_images": plan["expected_images"], "target": plan["target"]}
    )
    
    # Stage 2: Input Validation
    validation = validate_inputs(images, plan["expected_images"], modality=plan["task"])
    trace.add_step(
        "VALIDATE",
        f"Verified {validation['image_count']} image(s), dimension: {validation['dimensions']}, co-registered: {validation['co_registered']}"
    )
    
    # Stage 3: Tool Execution
    task = plan["task"]
    trace.add_step("DISPATCH", f"Dispatching execution payload to specialist tool '{plan['tool_name']}'")
    
    if task == "SINGLE_VQA":
        tool_res = run_single_vqa(images[0], query)
    elif task == "GROUNDING":
        tool_res = run_grounding(images[0], plan["target"], query)
    elif task in ("TEMPORAL_CHANGE", "CHANGE_VQA"):
        tool_res = run_change_analysis(images[0], images[1], query, task=task)
    elif task == "OPTICAL_SAR_FUSION":
        tool_res = run_optical_sar_fusion(images[0], images[1], query)
    else:
        tool_res = run_single_vqa(images[0], query)
        
    trace.add_step("COMPUTE", f"Specialist tool '{plan['tool_name']}' completed execution with verified measurements")
    
    # Stage 4: Dual-Estimate Confidence Scoring
    confidence = compute_confidence(task, tool_res, len(images))
    trace.add_step(
        "CONFIDENCE",
        f"Calculated dual-estimate confidence: {confidence['confidence_percentage']} ({confidence['rating']})"
    )
    
    # Stage 5: Evidence Compilation
    report = generate_evidence_report(
        session_id=session_id,
        query=query,
        classification=plan,
        validation_info=validation,
        tool_results=tool_res,
        confidence=confidence,
        trace_log=trace.get_trace_log()
    )
    trace.add_step("REPORT", f"Evidence report packaged with ID: {report['data']['report_id']}")
    
    return {
        "session_id": session_id,
        "query": query,
        "task": plan["task"],
        "task_description": plan["description"],
        "tool_used": plan["tool_name"],
        "answer": tool_res.get("answer"),
        "confidence": confidence,
        "results": tool_res,
        "trace": trace.get_trace_log(),
        "report_id": report["data"]["report_id"],
        "report_html": report["html"],
        "duration_ms": trace.total_duration_ms()
    }
