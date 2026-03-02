"""SEC Rule 206(4)-1 Marketing Risk Scanner."""
from __future__ import annotations

import json
import logging
import re
from typing import Any

from ..llm.ollama import get_llm
from .prompts import MARKETING_SCANNER_PROMPT

log = logging.getLogger(__name__)


async def scan_marketing_text(text: str) -> dict[str, Any]:
    """Scan marketing text for SEC Rule 206(4)-1 violations.

    Uses local Ollama LLM with regex fallback when unavailable.
    """
    prompt = (
        f"Analyze this RIA marketing text for SEC Rule 206(4)-1 violations:\n\n"
        f"---BEGIN TEXT---\n{text}\n---END TEXT---\n\n"
        f"Return your analysis as valid JSON only, no other text."
    )

    try:
        llm = get_llm(temperature=0.2)
        response = await llm.ainvoke([
            {"role": "system", "content": MARKETING_SCANNER_PROMPT},
            {"role": "user", "content": prompt},
        ])

        content = response.content
        # Try to extract JSON from response (handle markdown code blocks)
        json_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", content)
        if json_match:
            content = json_match.group(1).strip()

        result = json.loads(content)
    except json.JSONDecodeError:
        log.warning("LLM returned non-JSON, wrapping response")
        result = {
            "violations": [],
            "summary": {"total_issues": 0, "overall_risk": "UNKNOWN"},
            "raw_analysis": response.content,
        }
    except Exception as e:
        log.error("Marketing scan LLM call failed: %s", e)
        result = _fallback_scan(text)

    return result


# -- Regex patterns for common marketing violations --
_VIOLATION_PATTERNS: list[tuple[re.Pattern, str, str, str]] = [
    (
        re.compile(r"\bguarantee[ds]?\b", re.IGNORECASE),
        "Rule 206(4)-1(a)(1)",
        "Guarantee language implies no risk of loss, which is an untrue statement of material fact.",
        "Remove guarantee language. No investment outcome can be guaranteed.",
    ),
    (
        re.compile(r"\brisk[- ]?free\b", re.IGNORECASE),
        "Rule 206(4)-1(a)(1)",
        "No investment strategy is risk-free. This is an untrue statement of material fact.",
        "Replace with accurate risk disclosure appropriate to the strategy.",
    ),
    (
        re.compile(r"\b(?:no|zero|without)\s+(?:risk|downside|loss)", re.IGNORECASE),
        "Rule 206(4)-1(a)(1)",
        "Claiming zero risk or no downside is materially misleading.",
        "Include balanced risk disclosure alongside any discussion of potential benefits.",
    ),
    (
        re.compile(r"\d+%\s*(?:return|gain|yield|growth|performance)", re.IGNORECASE),
        "Rule 206(4)-1(d)",
        "Specific performance figures must show net-of-fees returns with appropriate disclosures.",
        "Show net-of-fees performance, include time period, and add required disclaimers.",
    ),
    (
        re.compile(r"\bbest\s+(?:performing|track\s+record|returns|in\s+class)", re.IGNORECASE),
        "Rule 206(4)-1(a)(4)",
        "Superlative performance claims may constitute cherry-picking without balanced context.",
        "Provide fair and balanced context including risks and limitations.",
    ),
    (
        re.compile(r"\b(?:outperform|beat(?:s|ing)?)\s+(?:the\s+)?(?:market|S&P|index|benchmark)", re.IGNORECASE),
        "Rule 206(4)-1(a)(2)",
        "Claims of outperformance must be substantiated with verifiable data.",
        "Include verifiable performance data with net-of-fees returns and appropriate benchmarks.",
    ),
    (
        re.compile(r"\b(?:award|ranked|rated|top|#1|number\s+one)\b", re.IGNORECASE),
        "Rule 206(4)-1(c)",
        "Third-party ratings and rankings have specific disclosure requirements.",
        "Disclose the rating criteria, date, and that the questionnaire was not designed for predetermined results.",
    ),
    (
        re.compile(r"\b(?:testimonial|client\s+said|client\s+review|endorsement)\b", re.IGNORECASE),
        "Rule 206(4)-1(b)",
        "Testimonials and endorsements require specific disclosures.",
        "Include required disclosures: client status, compensation, and material conflicts.",
    ),
    (
        re.compile(r"\b(?:hypothetical|backtested|simulated|projected)\b", re.IGNORECASE),
        "Rule 206(4)-1(d)(5)",
        "Hypothetical performance has strict presentation requirements.",
        "Ensure audience relevance, include methodology, assumptions, and limitations.",
    ),
    (
        re.compile(r"\bpast\s+performance\b(?!.*(?:not\s+(?:indicative|guarantee)|no\s+guarantee))", re.IGNORECASE),
        "Rule 206(4)-1(d)",
        "Past performance references require disclaimers that past performance does not guarantee future results.",
        "Add: 'Past performance is not indicative of future results.'",
    ),
]


def _fallback_scan(text: str) -> dict[str, Any]:
    """Regex-based fallback when LLM is unavailable."""
    violations = []

    for pattern, citation, explanation, suggestion in _VIOLATION_PATTERNS:
        for match in pattern.finditer(text):
            # Get surrounding context (up to 50 chars each side)
            start = max(0, match.start() - 50)
            end = min(len(text), match.end() + 50)
            excerpt = text[start:end].strip()
            if start > 0:
                excerpt = "..." + excerpt
            if end < len(text):
                excerpt = excerpt + "..."

            violations.append({
                "severity": "WARNING",
                "text_excerpt": excerpt,
                "rule_citation": citation,
                "explanation": explanation,
                "suggestion": suggestion,
            })

    critical = sum(1 for v in violations if v["severity"] == "CRITICAL")
    warnings = sum(1 for v in violations if v["severity"] == "WARNING")

    if critical > 0:
        risk = "HIGH"
    elif warnings > 2:
        risk = "HIGH"
    elif warnings > 0:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    return {
        "violations": violations,
        "summary": {
            "total_issues": len(violations),
            "critical": critical,
            "warnings": warnings,
            "info": 0,
            "overall_risk": risk,
        },
        "note": "Fallback regex scan — LLM unavailable",
    }
