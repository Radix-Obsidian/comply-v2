"""PII scanning and redaction."""
from __future__ import annotations

import re

_PII_PATTERNS: dict[str, re.Pattern] = {
    "email": re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"),
    "ssn": re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    "credit_card": re.compile(r"\b(?:\d[ -]?){13,16}\b"),
    "phone": re.compile(r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"),
    "ip_address": re.compile(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b"),
}


class PIIGuard:
    def __init__(self, enabled: bool = True):
        self.enabled = enabled

    def scan(self, text: str) -> dict[str, list[str]]:
        """Return dict of PII type -> list of matches found."""
        if not self.enabled:
            return {}
        findings = {}
        for pii_type, pattern in _PII_PATTERNS.items():
            matches = pattern.findall(text)
            if matches:
                findings[pii_type] = matches
        return findings

    def has_pii(self, text: str) -> bool:
        """Quick check: does the text contain any PII?"""
        return bool(self.scan(text))

    def redact(self, text: str) -> str:
        """Replace all PII matches with redaction markers."""
        if not self.enabled:
            return text
        for pii_type, pattern in _PII_PATTERNS.items():
            text = pattern.sub(f"[REDACTED-{pii_type.upper()}]", text)
        return text
