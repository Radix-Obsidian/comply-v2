from datetime import datetime, timedelta, timezone

from fastapi import APIRouter

from ..database import get_connection

router = APIRouter()


@router.get("/stats")
async def dashboard_stats():
    """Compliance dashboard summary stats."""
    conn = get_connection()
    try:
        policies = conn.execute("SELECT COUNT(*) as cnt FROM policies").fetchone()["cnt"]
        active_policies = conn.execute(
            "SELECT COUNT(*) as cnt FROM policies WHERE status = 'active'"
        ).fetchone()["cnt"]
        draft_policies = conn.execute(
            "SELECT COUNT(*) as cnt FROM policies WHERE status = 'draft'"
        ).fetchone()["cnt"]

        attestations = conn.execute("SELECT COUNT(*) as cnt FROM attestations").fetchone()["cnt"]

        # Expiring within 30 days
        cutoff = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        now = datetime.now(timezone.utc).isoformat()
        expiring = conn.execute(
            "SELECT COUNT(*) as cnt FROM attestations WHERE expires_at <= ? AND expires_at >= ?",
            (cutoff, now),
        ).fetchone()["cnt"]

        scans = conn.execute("SELECT COUNT(*) as cnt FROM scan_results").fetchone()["cnt"]

        # Recent scans (last 7 days)
        week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        recent_scans = conn.execute(
            "SELECT COUNT(*) as cnt FROM scan_results WHERE scanned_at >= ?", (week_ago,)
        ).fetchone()["cnt"]

        pending_tasks = conn.execute(
            "SELECT COUNT(*) as cnt FROM workflow_tasks WHERE status = 'pending'"
        ).fetchone()["cnt"]
    finally:
        conn.close()

    # Compliance score: rough heuristic
    score = 0
    if policies > 0:
        score += min(40, int(active_policies / max(policies, 1) * 40))
    if attestations > 0:
        score += 30
    if scans > 0:
        score += 20
    if pending_tasks == 0:
        score += 10

    return {
        "compliance_score": score,
        "policies": {"total": policies, "active": active_policies, "draft": draft_policies},
        "attestations": {"total": attestations, "expiring_30d": expiring},
        "scans": {"total": scans, "recent_7d": recent_scans},
        "pending_tasks": pending_tasks,
    }
