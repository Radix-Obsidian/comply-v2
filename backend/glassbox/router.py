"""Glass Box scanner FastAPI router."""

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, File, HTTPException, UploadFile

from ..models.scan_result import MarketingScanRequest, PolicyGapRequest
from .marketing_scanner import scan_marketing_text
from .policy_gap_detector import detect_policy_gaps
from .file_extractor import extract_text

glassbox_router = APIRouter(tags=["glassbox"])


@glassbox_router.post("/scan-marketing")
async def scan_marketing(request: MarketingScanRequest):
    """Scan marketing text for SEC Rule 206(4)-1 violations.

    Input: marketing text (email, website copy, social post, brochure, etc.)
    Output: flagged violations with exact SEC rule citations and suggestions.
    """
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="text field is required")

    result = await scan_marketing_text(request.text)
    result["scan_id"] = str(uuid.uuid4())
    result["scan_type"] = "marketing"
    result["scanned_at"] = datetime.now(timezone.utc).isoformat()
    return result


@glassbox_router.post("/scan-marketing-file")
async def scan_marketing_file(file: UploadFile = File(...)):
    """Upload a document and scan extracted text for SEC Rule 206(4)-1 violations.

    Supported formats: PDF, DOCX, TXT, CSV, XLSX (max 10 MB).
    """
    text, filetype = await extract_text(file)
    result = await scan_marketing_text(text)
    result["scan_id"] = str(uuid.uuid4())
    result["scan_type"] = "marketing"
    result["scanned_at"] = datetime.now(timezone.utc).isoformat()
    result["source"] = {
        "filename": file.filename,
        "filetype": filetype,
        "chars_extracted": len(text),
    }
    return result


@glassbox_router.post("/detect-policy-gaps")
async def detect_gaps(request: PolicyGapRequest):
    """Detect gaps in RIA compliance policies against SEC Rule 206(4)-7.

    Input: policy text or list of policy documents.
    Output: missing/incomplete policy areas with SEC rule references.
    """
    if request.policies:
        input_data = request.policies
    elif request.text:
        input_data = request.text
    else:
        raise HTTPException(status_code=400, detail="policies or text field required")

    result = await detect_policy_gaps(input_data)
    result["scan_id"] = str(uuid.uuid4())
    result["scan_type"] = "policy_gaps"
    result["scanned_at"] = datetime.now(timezone.utc).isoformat()
    return result


@glassbox_router.post("/detect-policy-gaps-file")
async def detect_gaps_file(file: UploadFile = File(...)):
    """Upload a document and detect policy gaps against SEC Rule 206(4)-7.

    Supported formats: PDF, DOCX, TXT, CSV, XLSX (max 10 MB).
    """
    text, filetype = await extract_text(file)
    result = await detect_policy_gaps(text)
    result["scan_id"] = str(uuid.uuid4())
    result["scan_type"] = "policy_gaps"
    result["scanned_at"] = datetime.now(timezone.utc).isoformat()
    result["source"] = {
        "filename": file.filename,
        "filetype": filetype,
        "chars_extracted": len(text),
    }
    return result
