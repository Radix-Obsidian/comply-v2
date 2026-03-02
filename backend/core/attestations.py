from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException

from ..compliance.audit_logger import AuditLogger
from ..database import get_connection
from ..models.attestation import AttestationCreate, AttestationResponse

router = APIRouter()
audit = AuditLogger()


@router.post("/", response_model=AttestationResponse)
async def create_attestation(attestation: AttestationCreate):
    conn = get_connection()
    try:
        # Verify policy exists
        policy = conn.execute(
            "SELECT id FROM policies WHERE id = ?", (attestation.policy_id,)
        ).fetchone()
        if not policy:
            raise HTTPException(status_code=404, detail="Policy not found")

        now = datetime.now(timezone.utc)
        att_id = str(uuid.uuid4())
        expires = (now + timedelta(days=365)).isoformat()  # Annual attestation

        conn.execute(
            "INSERT INTO attestations (id, policy_id, attested_by, attested_at, expires_at, notes) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (att_id, attestation.policy_id, attestation.attested_by, now.isoformat(), expires, attestation.notes),
        )
        conn.commit()
    finally:
        conn.close()

    audit.record(
        actor=attestation.attested_by, action="attestation_created",
        resource_type="attestation", resource_id=att_id,
    )
    return AttestationResponse(
        id=att_id, policy_id=attestation.policy_id,
        attested_by=attestation.attested_by, attested_at=now.isoformat(),
        expires_at=expires, notes=attestation.notes,
    )


@router.get("/")
async def list_attestations(policy_id: str | None = None):
    conn = get_connection()
    try:
        if policy_id:
            rows = conn.execute(
                "SELECT * FROM attestations WHERE policy_id = ? ORDER BY attested_at DESC",
                (policy_id,),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM attestations ORDER BY attested_at DESC").fetchall()
    finally:
        conn.close()
    return [dict(r) for r in rows]


@router.get("/expiring")
async def expiring_attestations(days: int = 30):
    """List attestations expiring within the specified number of days."""
    cutoff = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
    now = datetime.now(timezone.utc).isoformat()
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM attestations WHERE expires_at <= ? AND expires_at >= ? ORDER BY expires_at ASC",
            (cutoff, now),
        ).fetchall()
    finally:
        conn.close()
    return [dict(r) for r in rows]
