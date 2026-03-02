from pydantic import BaseModel
from typing import Any, Optional


class MarketingScanRequest(BaseModel):
    text: str


class PolicyGapRequest(BaseModel):
    policies: Optional[list[dict[str, str]]] = None
    text: Optional[str] = None


class Violation(BaseModel):
    severity: str
    text_excerpt: str
    rule_citation: str
    explanation: str
    suggestion: str


class PolicyGap(BaseModel):
    area: str
    rule_reference: str
    status: str  # MISSING, INCOMPLETE, OUTDATED
    description: str
    recommendation: str


class ScanSummary(BaseModel):
    total_issues: int = 0
    critical: int = 0
    warnings: int = 0
    info: int = 0
    overall_risk: str = "UNKNOWN"


class FileSourceMeta(BaseModel):
    filename: str
    filetype: str
    chars_extracted: int
