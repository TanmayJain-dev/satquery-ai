"""
report_generator.py
--------------------
Generates auditable evidence reports in JSON and printable HTML format
for evaluation by hackathon judges and domain analysts.
"""

import json
from datetime import datetime
from typing import Dict, Any

def generate_evidence_report(
    session_id: str,
    query: str,
    classification: Dict[str, Any],
    validation_info: Dict[str, Any],
    tool_results: Dict[str, Any],
    confidence: Dict[str, Any],
    trace_log: list
) -> Dict[str, Any]:
    """
    Compiles full execution provenance into an auditable evidence package.
    """
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    report_dict = {
        "report_id": f"SATQUERY-EVID-{session_id[:8].upper()}",
        "problem_statement": "SIH26167: SatQuery AI (ISRO)",
        "copyright": "Copyright (c) 2026 Tanmay Jain. All rights reserved.",
        "generated_at": timestamp,
        "query": query,
        "agentic_plan": classification,
        "input_validation": validation_info,
        "tool_results": {k: v for k, v in tool_results.items() if not k.endswith("_url")},
        "confidence_audit": confidence,
        "execution_trace": trace_log
    }
    
    # Styled printable HTML for judges
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>SatQuery AI — Execution Audit Report</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0a0a0c; color: #f4f4f5; padding: 32px; }}
        .badge {{ display: inline-block; padding: 4px 10px; background: #27272a; border: 1px solid #3f3f46; border-radius: 4px; font-size: 12px; font-weight: 600; color: #38bdf8; }}
        h1 {{ font-size: 24px; color: #ffffff; margin-bottom: 4px; }}
        .header {{ border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 24px; }}
        .card {{ background: #121215; border: 1px solid #27272a; border-radius: 8px; padding: 20px; margin-bottom: 20px; }}
        .field-label {{ color: #a1a1aa; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }}
        .field-val {{ color: #fafafa; font-size: 15px; margin-top: 4px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
        th, td {{ text-align: left; padding: 10px 12px; border-bottom: 1px solid #27272a; font-size: 13px; }}
        th {{ color: #a1a1aa; background: #18181b; }}
        .trace-tag {{ color: #38bdf8; font-family: monospace; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="header">
        <span class="badge">ISRO · SIH26167 VERIFIED AUDIT</span>
        <h1>SatQuery AI — Observable Evidence Report</h1>
        <div style="color: #71717a; font-size: 13px;">Report ID: {report_dict['report_id']} · Generated: {timestamp}</div>
    </div>
    
    <div class="card">
        <div class="field-label">Natural Language Query</div>
        <div class="field-val" style="font-size: 18px; font-weight: 500; color: #38bdf8;">"{query}"</div>
        <div style="margin-top: 16px; display: flex; gap: 32px;">
            <div>
                <div class="field-label">Task Classification</div>
                <div class="field-val">{classification.get('task')} ({classification.get('description')})</div>
            </div>
            <div>
                <div class="field-label">Primary Tool Invoked</div>
                <div class="field-val" style="font-family: monospace;">{classification.get('tool_name')}</div>
            </div>
            <div>
                <div class="field-label">Confidence Score</div>
                <div class="field-val" style="color: #4ade80; font-weight: 600;">{confidence.get('confidence_percentage')} ({confidence.get('rating')})</div>
            </div>
        </div>
    </div>

    <div class="card">
        <div class="field-label">Grounded Finding & Synthesis</div>
        <div class="field-val" style="white-space: pre-line; margin-top: 8px;">{tool_results.get('answer')}</div>
    </div>

    <div class="card">
        <div class="field-label">Step-by-Step Agentic Trace</div>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Time</th>
                    <th>Stage</th>
                    <th>Action / Observable Output</th>
                </tr>
            </thead>
            <tbody>
                {''.join(f"<tr><td>{s.get('step_id')}</td><td>+{s.get('timestamp_ms')}ms</td><td class='trace-tag'>[{s.get('stage')}]</td><td>{s.get('message')}</td></tr>" for s in trace_log)}
            </tbody>
        </table>
    </div>

    <div style="margin-top: 32px; border-top: 1px solid #27272a; padding-top: 16px; text-align: center; color: #71717a; font-size: 12px;">
        &copy; 2026 <strong>Tanmay Jain</strong>. All rights reserved. &middot; SIH26167 SatQuery AI Platform
    </div>
</body>
</html>
"""
    return {
        "data": report_dict,
        "html": html_content
    }
