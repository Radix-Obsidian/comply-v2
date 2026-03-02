"""Document generation router — compliance certs, reports, etc."""

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from ..database import get_connection
from ..llm.ollama import get_llm

router = APIRouter()

_DOC_PROMPTS = {
    "compliance_cert": (
        "Generate a compliance certification document for an RIA firm. Include sections for:\n"
        "1. Certification statement\n2. Data handling practices\n3. Retention policy\n"
        "4. Audit trail description\n5. PII safeguards\n6. Signatory block\n"
        "Output as clean markdown."
    ),
    "annual_review": (
        "Generate an annual compliance review template for an RIA. Include sections for:\n"
        "1. Review period and scope\n2. Policy inventory and updates\n"
        "3. Testing methodology\n4. Findings and observations\n"
        "5. Remediation plan\n6. CCO certification\n"
        "Output as clean markdown."
    ),
    "risk_assessment": (
        "Generate a compliance risk assessment template for an RIA. Include:\n"
        "1. Risk categories (regulatory, operational, reputational)\n"
        "2. Risk scoring methodology\n3. Current risk inventory\n"
        "4. Mitigation strategies\n5. Monitoring plan\n"
        "Output as clean markdown."
    ),
}


@router.post("/generate")
async def generate_document(doc_type: str, context: str = ""):
    """Generate a compliance document using local LLM."""
    if doc_type not in _DOC_PROMPTS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid doc_type. Must be one of: {list(_DOC_PROMPTS.keys())}",
        )

    prompt = _DOC_PROMPTS[doc_type]
    if context:
        prompt += f"\n\nAdditional context:\n{context}"

    try:
        llm = get_llm(temperature=0.3)
        response = await llm.ainvoke([
            {"role": "system", "content": "You are a compliance document specialist for registered investment advisers."},
            {"role": "user", "content": prompt},
        ])
        content = response.content
    except Exception:
        content = f"# {doc_type.replace('_', ' ').title()}\n\n*Document generation requires Ollama to be running.*\n\nPlease ensure Ollama is available and try again."

    doc_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # Store the generated document as a scan result for audit trail
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO scan_results (id, scan_type, input_text, result_json, scanned_at) VALUES (?, ?, ?, ?, ?)",
            (doc_id, f"doc_{doc_type}", context or "N/A", json.dumps({"content": content}), now),
        )
        conn.commit()
    finally:
        conn.close()

    return {"id": doc_id, "doc_type": doc_type, "content": content, "generated_at": now}


@router.get("/types")
async def list_document_types():
    return {"types": list(_DOC_PROMPTS.keys())}
