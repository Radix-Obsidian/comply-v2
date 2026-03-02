"""SEC Rule 206(4)-7 Policy Gap Detector."""
from __future__ import annotations

import json
import logging
import re
from typing import Any

from ..llm.ollama import get_llm
from .prompts import POLICY_GAP_PROMPT
from .sec_rules import SEC_COMPLIANCE_RULE

log = logging.getLogger(__name__)


async def detect_policy_gaps(policies: list[dict[str, str]] | str) -> dict[str, Any]:
    """Detect gaps in RIA compliance policies against SEC Rule 206(4)-7.

    Accepts either a list of policy dicts or raw policy text.
    Uses local Ollama LLM with keyword fallback when unavailable.
    """
    if isinstance(policies, list):
        policy_text = "\n\n".join(
            f"### {p.get('title', 'Untitled')}\n{p.get('content', '')}"
            for p in policies
        )
    else:
        policy_text = policies

    prompt = (
        f"Analyze these RIA compliance policies for gaps against SEC Rule 206(4)-7:\n\n"
        f"---BEGIN POLICIES---\n{policy_text}\n---END POLICIES---\n\n"
        f"Return your gap analysis as valid JSON only, no other text."
    )

    try:
        llm = get_llm(temperature=0.2)
        response = await llm.ainvoke([
            {"role": "system", "content": POLICY_GAP_PROMPT},
            {"role": "user", "content": prompt},
        ])

        content = response.content
        json_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", content)
        if json_match:
            content = json_match.group(1).strip()

        result = json.loads(content)
    except json.JSONDecodeError:
        log.warning("LLM returned non-JSON, wrapping response")
        result = {
            "gaps": [],
            "covered_areas": [],
            "summary": {"compliance_score": 0},
            "raw_analysis": response.content,
        }
    except Exception as e:
        log.error("Policy gap detection LLM call failed: %s", e)
        result = _fallback_gap_check(policy_text)

    return result


# Keyword map for each required policy area
_AREA_KEYWORDS: dict[str, list[str]] = {
    "portfolio_management": [
        "portfolio management", "investment process", "suitability",
        "diversification", "risk management", "investment policy",
    ],
    "trading_practices": [
        "best execution", "trading", "trade allocation", "soft dollar",
        "aggregation", "order routing",
    ],
    "proprietary_trading": [
        "personal trading", "proprietary trading", "pre-clearance",
        "access person", "insider trading",
    ],
    "accuracy_of_disclosures": [
        "form adv", "disclosure", "brochure", "client reporting",
        "material change",
    ],
    "safeguarding_client_assets": [
        "custody", "safeguarding", "client assets", "safekeeping",
        "account statement", "surprise examination",
    ],
    "books_and_records": [
        "books and records", "recordkeeping", "record keeping",
        "rule 204-2", "retention", "document management",
    ],
    "marketing": [
        "marketing", "advertising", "performance presentation",
        "testimonial", "endorsement", "social media",
    ],
    "valuation": [
        "valuation", "fair value", "pricing", "net asset value",
        "mark to market",
    ],
    "privacy": [
        "privacy", "regulation s-p", "data protection", "breach notification",
        "personally identifiable", "pii", "nonpublic personal",
    ],
    "business_continuity": [
        "business continuity", "disaster recovery", "succession",
        "pandemic", "bcp", "contingency",
    ],
    "code_of_ethics": [
        "code of ethics", "standards of conduct", "gift",
        "outside business", "political contribution",
    ],
    "proxy_voting": [
        "proxy", "proxy voting", "shareholder voting",
    ],
    "chief_compliance_officer": [
        "chief compliance officer", "cco", "compliance officer",
        "compliance function", "compliance department",
    ],
    "annual_review": [
        "annual review", "annual compliance", "compliance review",
        "compliance testing", "remediation",
    ],
}


def _fallback_gap_check(text: str) -> dict[str, Any]:
    """Keyword-based fallback when LLM is unavailable."""
    required = SEC_COMPLIANCE_RULE["required_policy_areas"]
    descriptions = SEC_COMPLIANCE_RULE["area_descriptions"]
    text_lower = text.lower()

    covered = []
    gaps = []

    for area in required:
        keywords = _AREA_KEYWORDS.get(area, [area.replace("_", " ")])
        if any(kw in text_lower for kw in keywords):
            covered.append(area)
        else:
            gaps.append({
                "area": area.replace("_", " ").title(),
                "rule_reference": "Rule 206(4)-7",
                "status": "MISSING",
                "description": f"No policy found addressing: {descriptions.get(area, area)}",
                "recommendation": f"Create a written policy covering {descriptions.get(area, area)}",
            })

    score = int(len(covered) / len(required) * 100) if required else 0

    return {
        "gaps": gaps,
        "covered_areas": [a.replace("_", " ").title() for a in covered],
        "summary": {
            "total_required": len(required),
            "covered": len(covered),
            "missing": len(gaps),
            "incomplete": 0,
            "compliance_score": score,
        },
        "note": "Fallback keyword scan — LLM unavailable",
    }
