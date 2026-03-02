"""Data retention enforcement per SEC requirements."""

from datetime import datetime, timedelta, timezone

from ..config import RETENTION_DAYS
from ..database import get_connection


class RetentionPolicy:
    def enforce(self) -> dict:
        """Delete scan results older than the retention window.

        SEC requires RIAs to maintain books and records for 5-7 years.
        Default retention is 2555 days (7 years).
        """
        cutoff = (datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)).isoformat()
        conn = get_connection()
        try:
            cursor = conn.execute(
                "DELETE FROM scan_results WHERE scanned_at < ?", (cutoff,)
            )
            deleted = cursor.rowcount
            conn.commit()
        finally:
            conn.close()

        return {
            "deleted_records": deleted,
            "retention_days": RETENTION_DAYS,
            "cutoff": cutoff,
        }

    def status(self) -> dict:
        """Return retention policy status and record counts."""
        conn = get_connection()
        try:
            row = conn.execute("SELECT COUNT(*) as cnt FROM scan_results").fetchone()
            oldest = conn.execute(
                "SELECT MIN(scanned_at) as oldest FROM scan_results"
            ).fetchone()
        finally:
            conn.close()

        return {
            "retention_days": RETENTION_DAYS,
            "total_records": row["cnt"],
            "oldest_record": oldest["oldest"],
        }
