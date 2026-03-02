"""Glass Box scanner FastAPI router."""

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from ..models.scan_result import MarketingScanRequest, PolicyGapRequest
from .marketing_scanner import scan_marketing_text
from .policy_gap_detector import detect_policy_gaps

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
