"""AI Insights aggregator — combines multiple data sources into
contextual recommendations for the dashboard."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter

from ..database import get_connection

router = APIRouter()


@router.get("/ai-insights")
async def get_ai_insights(role: str = "owner"):
    """Generate contextual AI insights from aggregated compliance data.

    Args:
        role: 'owner' or 'staff' — changes insight prioritization.
    """
    conn = get_connection()
    now = datetime.now(timezone.utc)
    insights: list[dict] = []

    try:
        # ---- 1. Attestation expiry ----
        expiring_7d = conn.execute(
            "SELECT COUNT(*) as cnt FROM attestations WHERE expires_at <= ? AND expires_at >= ?",
            ((now + timedelta(days=7)).isoformat(), now.isoformat()),
        ).fetchone()["cnt"]

        expiring_30d = conn.execute(
            "SELECT COUNT(*) as cnt FROM attestations WHERE expires_at <= ? AND expires_at >= ?",
            ((now + timedelta(days=30)).isoformat(), now.isoformat()),
        ).fetchone()["cnt"]

        next_expiry = conn.execute(
            "SELECT expires_at FROM attestations WHERE expires_at >= ? ORDER BY expires_at ASC LIMIT 1",
            (now.isoformat(),),
        ).fetchone()

        if expiring_7d > 0:
            insights.append({
                "id": "att-expiry-urgent",
                "severity": "critical",
                "title": f"{expiring_7d} attestation(s) expire this week",
                "description": "Immediate renewal required to maintain compliance.",
                "action": {"label": "Review Attestations", "href": "/policies"},
                "timestamp": now.isoformat(),
            })
        elif expiring_30d > 0:
            insights.append({
                "id": "att-expiry-warning",
                "severity": "warning",
                "title": f"{expiring_30d} attestation(s) expire within 30 days",
                "description": "Schedule renewals to avoid gaps in compliance coverage.",
                "action": {"label": "View Expiring", "href": "/policies"},
                "timestamp": now.isoformat(),
            })
        elif next_expiry:
            insights.append({
                "id": "att-all-current",
                "severity": "success",
                "title": "All attestations current",
                "description": f"Next expiry: {next_expiry['expires_at'][:10]}",
                "action": None,
                "timestamp": now.isoformat(),
            })

        # ---- 2. Scan recency ----
        last_scan = conn.execute(
            "SELECT scanned_at FROM scan_results ORDER BY scanned_at DESC LIMIT 1"
        ).fetchone()

        if last_scan:
            last_scan_date = datetime.fromisoformat(last_scan["scanned_at"].replace("Z", "+00:00"))
            days_since = (now - last_scan_date).days
            if days_since > 14:
                insights.append({
                    "id": "scan-stale",
                    "severity": "warning",
                    "title": f"Marketing materials not scanned in {days_since} days",
                    "description": "Regular scanning helps catch SEC Rule 206(4)-1 violations early.",
                    "action": {"label": "Run Scan", "href": "/scanner"},
                    "timestamp": now.isoformat(),
                })
        else:
            insights.append({
                "id": "scan-never",
                "severity": "warning",
                "title": "No marketing scans have been run yet",
                "description": "Scan your marketing materials to check for SEC compliance.",
                "action": {"label": "Start Scanning", "href": "/scanner"},
                "timestamp": now.isoformat(),
            })

        # ---- 3. Pending workflow tasks ----
        critical_tasks = conn.execute(
            "SELECT COUNT(*) as cnt FROM workflow_tasks WHERE status = 'pending' AND priority = 'critical'"
        ).fetchone()["cnt"]

        pending_tasks = conn.execute(
            "SELECT COUNT(*) as cnt FROM workflow_tasks WHERE status = 'pending'"
        ).fetchone()["cnt"]

        if critical_tasks > 0:
            insights.append({
                "id": "tasks-critical",
                "severity": "critical",
                "title": f"{critical_tasks} critical task(s) need immediate attention",
                "description": "Critical workflow items should be resolved before end of business.",
                "action": {"label": "View Tasks", "href": "/"},
                "timestamp": now.isoformat(),
            })
        elif pending_tasks > 3:
            insights.append({
                "id": "tasks-backlog",
                "severity": "info",
                "title": f"{pending_tasks} pending tasks in backlog",
                "description": "Consider prioritizing your task queue to maintain efficiency.",
                "action": {"label": "View Tasks", "href": "/"},
                "timestamp": now.isoformat(),
            })

        # ---- 4. Upcoming calendar deadlines ----
        upcoming_7d = conn.execute(
            "SELECT * FROM calendar_events WHERE due_date >= ? AND due_date <= ? AND status = 'pending' ORDER BY due_date ASC",
            (now.isoformat(), (now + timedelta(days=7)).isoformat()),
        ).fetchall()

        for event in upcoming_7d[:3]:  # Cap at 3 calendar insights
            insights.append({
                "id": f"cal-{event['id']}",
                "severity": "warning",
                "title": f"Upcoming: {event['title']}",
                "description": f"Due {event['due_date'][:10]} — {event.get('event_type', 'deadline')}",
                "action": {"label": "View Calendar", "href": "/calendar"},
                "timestamp": now.isoformat(),
            })

        # ---- 5. Policy coverage ----
        active_policies = conn.execute(
            "SELECT COUNT(*) as cnt FROM policies WHERE status = 'active'"
        ).fetchone()["cnt"]

        total_policies = conn.execute(
            "SELECT COUNT(*) as cnt FROM policies"
        ).fetchone()["cnt"]

        draft_policies = conn.execute(
            "SELECT COUNT(*) as cnt FROM policies WHERE status = 'draft'"
        ).fetchone()["cnt"]

        if active_policies < 5:
            insights.append({
                "id": "policy-low-coverage",
                "severity": "info",
                "title": "Policy coverage is limited",
                "description": f"Only {active_policies} active policies. SEC Rule 206(4)-7 requires coverage of 14 areas.",
                "action": {"label": "Review Policies", "href": "/policies"},
                "timestamp": now.isoformat(),
            })

        if draft_policies > 0:
            insights.append({
                "id": "policy-drafts",
                "severity": "info",
                "title": f"{draft_policies} policy draft(s) awaiting activation",
                "description": "Finalize and activate draft policies to improve compliance score.",
                "action": {"label": "Review Drafts", "href": "/policies"},
                "timestamp": now.isoformat(),
            })

        # ---- 6. Owner-specific recommendations ----
        if role == "owner" and active_policies >= 5:
            insights.append({
                "id": "owner-cco",
                "severity": "recommendation",
                "title": "Consider designating a Chief Compliance Officer",
                "description": "As your policy inventory grows, a dedicated CCO ensures consistent oversight and SEC examination readiness.",
                "action": None,
                "timestamp": now.isoformat(),
            })

        if role == "owner" and total_policies >= 10:
            insights.append({
                "id": "owner-annual-review",
                "severity": "recommendation",
                "title": "Schedule your annual compliance review",
                "description": "SEC Rule 206(4)-7 requires at least annual review of all compliance policies and procedures.",
                "action": {"label": "Generate Review", "href": "/"},
                "timestamp": now.isoformat(),
            })

        # ---- Calculate compliance score ----
        attestations_total = conn.execute("SELECT COUNT(*) as cnt FROM attestations").fetchone()["cnt"]
        scans_total = conn.execute("SELECT COUNT(*) as cnt FROM scan_results").fetchone()["cnt"]

        score = 0
        if total_policies > 0:
            score += min(40, int(active_policies / max(total_policies, 1) * 40))
        if attestations_total > 0:
            score += 30
        if scans_total > 0:
            score += 20
        if pending_tasks == 0:
            score += 10

    finally:
        conn.close()

    # Sort: critical → warning → info → recommendation → success
    severity_order = {"critical": 0, "warning": 1, "info": 2, "recommendation": 3, "success": 4}
    insights.sort(key=lambda i: severity_order.get(i["severity"], 99))

    # Generate AI summary (deterministic fallback)
    ai_summary = _generate_summary(score, insights)

    # Try LLM-enhanced summary
    try:
        from ..llm.ollama import get_llm

        llm = get_llm(temperature=0.3)
        context = f"Compliance score: {score}%. {len(insights)} insights. "
        context += ". ".join(i["title"] for i in insights[:5])
        resp = await llm.ainvoke([
            {
                "role": "system",
                "content": (
                    "You are a compliance dashboard AI for an RIA firm. "
                    "Generate a single concise sentence summarizing the firm's compliance status. "
                    "Be direct, actionable, and professional. Max 25 words."
                ),
            },
            {"role": "user", "content": context},
        ])
        ai_summary = resp.content.strip().strip('"')
    except Exception:
        pass  # Keep deterministic fallback

    return {
        "insights": insights,
        "ai_summary": ai_summary,
        "compliance_score": score,
        "trend": "stable",
        "trend_delta": 0,
        "generated_at": now.isoformat(),
    }


def _generate_summary(score: int, insights: list[dict]) -> str:
    """Deterministic summary when LLM is unavailable."""
    critical = sum(1 for i in insights if i["severity"] == "critical")
    warnings = sum(1 for i in insights if i["severity"] == "warning")

    if critical > 0:
        return f"Your firm is {score}% compliant. {critical} critical issue(s) need immediate attention."
    if warnings > 0:
        return f"Your firm is {score}% compliant. {warnings} item(s) need attention this week."
    if score >= 80:
        return f"Your firm is {score}% compliant. All systems healthy — keep up the great work."
    return f"Your firm is {score}% compliant. Review the insights below to improve your posture."
