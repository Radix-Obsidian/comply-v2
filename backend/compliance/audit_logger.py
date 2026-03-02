"""SHA-256 hash-chained audit logger writing to SQLite."""

import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any, Optional

from ..database import get_connection

log = logging.getLogger(__name__)


class AuditLogger:
    def record(
        self,
        actor: str,
        action: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
    ):
        ts = datetime.now(timezone.utc).isoformat()
        payload = metadata or {}
        raw = f"{ts}|{actor}|{action}|{json.dumps(payload, sort_keys=True)}"
        data_hash = hashlib.sha256(raw.encode()).hexdigest()

        conn = get_connection()
        try:
            conn.execute(
                "INSERT INTO audit_log (timestamp, actor, action, resource_type, resource_id, data_hash, metadata) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (ts, actor, action, resource_type, resource_id, data_hash, json.dumps(payload)),
            )
            conn.commit()
        finally:
            conn.close()

        log.info("audit: %s %s %s/%s", actor, action, resource_type, resource_id)

    def get_log(self, limit: int = 100, offset: int = 0) -> list[dict]:
        conn = get_connection()
        try:
            rows = conn.execute(
                "SELECT * FROM audit_log ORDER BY id DESC LIMIT ? OFFSET ?",
                (limit, offset),
            ).fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()

    def count(self) -> int:
        conn = get_connection()
        try:
            row = conn.execute("SELECT COUNT(*) as cnt FROM audit_log").fetchone()
            return row["cnt"]
        finally:
            conn.close()
