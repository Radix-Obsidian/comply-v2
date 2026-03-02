from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from ..compliance.audit_logger import AuditLogger
from ..database import get_connection
from ..models.policy import PolicyCreate, PolicyResponse, PolicyUpdate

router = APIRouter()
audit = AuditLogger()


@router.post("/", response_model=PolicyResponse)
async def create_policy(policy: PolicyCreate):
    now = datetime.now(timezone.utc).isoformat()
    policy_id = str(uuid.uuid4())
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO policies (id, title, category, content, version, status, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, 1, 'draft', ?, ?)",
            (policy_id, policy.title, policy.category, policy.content, now, now),
        )
        conn.commit()
    finally:
        conn.close()

    audit.record(actor="system", action="policy_created", resource_type="policy", resource_id=policy_id)
    return PolicyResponse(
        id=policy_id, title=policy.title, category=policy.category,
        content=policy.content, version=1, status="draft",
        created_at=now, updated_at=now,
    )


@router.get("/")
async def list_policies(category: str | None = None, status: str | None = None):
    conn = get_connection()
    try:
        query = "SELECT * FROM policies WHERE 1=1"
        params: list = []
        if category:
            query += " AND category = ?"
            params.append(category)
        if status:
            query += " AND status = ?"
            params.append(status)
        query += " ORDER BY updated_at DESC"
        rows = conn.execute(query, params).fetchall()
    finally:
        conn.close()
    return [dict(r) for r in rows]


@router.get("/{policy_id}", response_model=PolicyResponse)
async def get_policy(policy_id: str):
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM policies WHERE id = ?", (policy_id,)).fetchone()
    finally:
        conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Policy not found")
    return dict(row)


@router.patch("/{policy_id}", response_model=PolicyResponse)
async def update_policy(policy_id: str, update: PolicyUpdate):
    conn = get_connection()
    try:
        existing = conn.execute("SELECT * FROM policies WHERE id = ?", (policy_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Policy not found")

        now = datetime.now(timezone.utc).isoformat()
        fields = {}
        if update.title is not None:
            fields["title"] = update.title
        if update.content is not None:
            fields["content"] = update.content
            fields["version"] = existing["version"] + 1
        if update.status is not None:
            fields["status"] = update.status
        fields["updated_at"] = now

        set_clause = ", ".join(f"{k} = ?" for k in fields)
        values = list(fields.values()) + [policy_id]
        conn.execute(f"UPDATE policies SET {set_clause} WHERE id = ?", values)
        conn.commit()

        row = conn.execute("SELECT * FROM policies WHERE id = ?", (policy_id,)).fetchone()
    finally:
        conn.close()

    audit.record(actor="system", action="policy_updated", resource_type="policy", resource_id=policy_id)
    return dict(row)


@router.delete("/{policy_id}")
async def delete_policy(policy_id: str):
    conn = get_connection()
    try:
        cursor = conn.execute("DELETE FROM policies WHERE id = ?", (policy_id,))
        conn.commit()
    finally:
        conn.close()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Policy not found")
    audit.record(actor="system", action="policy_deleted", resource_type="policy", resource_id=policy_id)
    return {"deleted": policy_id}
