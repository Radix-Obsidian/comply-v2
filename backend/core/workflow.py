from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from ..compliance.audit_logger import AuditLogger
from ..database import get_connection

router = APIRouter()
audit = AuditLogger()

VALID_STATUSES = {"pending", "in_review", "approved", "rejected", "completed"}
VALID_PRIORITIES = {"low", "medium", "high", "critical"}


@router.post("/")
async def create_task(
    title: str,
    description: str = "",
    priority: str = "medium",
    assigned_to: str | None = None,
    policy_id: str | None = None,
):
    if priority not in VALID_PRIORITIES:
        raise HTTPException(status_code=400, detail=f"Invalid priority. Must be one of: {VALID_PRIORITIES}")

    now = datetime.now(timezone.utc).isoformat()
    task_id = str(uuid.uuid4())
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO workflow_tasks (id, title, description, status, priority, assigned_to, policy_id, created_at, updated_at) "
            "VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?)",
            (task_id, title, description, priority, assigned_to, policy_id, now, now),
        )
        conn.commit()
    finally:
        conn.close()

    audit.record(actor="system", action="task_created", resource_type="workflow_task", resource_id=task_id)
    return {"id": task_id, "title": title, "status": "pending", "priority": priority}


@router.get("/")
async def list_tasks(status: str | None = None, priority: str | None = None, assigned_to: str | None = None):
    conn = get_connection()
    try:
        query = "SELECT * FROM workflow_tasks WHERE 1=1"
        params: list = []
        if status:
            query += " AND status = ?"
            params.append(status)
        if priority:
            query += " AND priority = ?"
            params.append(priority)
        if assigned_to:
            query += " AND assigned_to = ?"
            params.append(assigned_to)
        query += " ORDER BY CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, updated_at DESC"
        rows = conn.execute(query, params).fetchall()
    finally:
        conn.close()
    return [dict(r) for r in rows]


@router.patch("/{task_id}")
async def update_task(task_id: str, status: str | None = None, priority: str | None = None, assigned_to: str | None = None):
    if status and status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {VALID_STATUSES}")
    if priority and priority not in VALID_PRIORITIES:
        raise HTTPException(status_code=400, detail=f"Invalid priority. Must be one of: {VALID_PRIORITIES}")

    now = datetime.now(timezone.utc).isoformat()
    conn = get_connection()
    try:
        fields: dict[str, str] = {"updated_at": now}
        if status:
            fields["status"] = status
        if priority:
            fields["priority"] = priority
        if assigned_to is not None:
            fields["assigned_to"] = assigned_to

        set_clause = ", ".join(f"{k} = ?" for k in fields)
        values = list(fields.values()) + [task_id]
        cursor = conn.execute(f"UPDATE workflow_tasks SET {set_clause} WHERE id = ?", values)
        conn.commit()
    finally:
        conn.close()

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    audit.record(actor="system", action="task_updated", resource_type="workflow_task", resource_id=task_id)
    return {"updated": task_id}
