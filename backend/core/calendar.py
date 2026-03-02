from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..database import get_connection

router = APIRouter()


class EventCreate(BaseModel):
    title: str
    event_type: str
    due_date: str
    end_date: str | None = None
    description: str = ""
    policy_id: str | None = None
    categories: str | None = None


class EventUpdate(BaseModel):
    title: str | None = None
    status: str | None = None
    description: str | None = None
    due_date: str | None = None
    end_date: str | None = None
    event_type: str | None = None
    categories: str | None = None


@router.post("/")
async def create_event(event: EventCreate):
    now = datetime.now(timezone.utc).isoformat()
    event_id = str(uuid.uuid4())
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO calendar_events (id, title, description, event_type, due_date, end_date, status, policy_id, categories, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)",
            (event_id, event.title, event.description, event.event_type, event.due_date, event.end_date, event.policy_id, event.categories, now),
        )
        conn.commit()
    finally:
        conn.close()
    return {"id": event_id, "title": event.title, "event_type": event.event_type, "due_date": event.due_date}


@router.get("/")
async def list_events(status: str | None = None, event_type: str | None = None):
    conn = get_connection()
    try:
        query = "SELECT * FROM calendar_events WHERE 1=1"
        params: list = []
        if status:
            query += " AND status = ?"
            params.append(status)
        if event_type:
            query += " AND event_type = ?"
            params.append(event_type)
        query += " ORDER BY due_date ASC"
        rows = conn.execute(query, params).fetchall()
    finally:
        conn.close()
    return [dict(r) for r in rows]


@router.get("/upcoming")
async def upcoming_events(days: int = 30):
    """Events due within the next N days."""
    from datetime import timedelta
    now = datetime.now(timezone.utc).isoformat()
    cutoff = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM calendar_events WHERE due_date >= ? AND due_date <= ? AND status = 'pending' ORDER BY due_date ASC",
            (now, cutoff),
        ).fetchall()
    finally:
        conn.close()
    return [dict(r) for r in rows]


@router.patch("/{event_id}")
async def update_event(event_id: str, update: EventUpdate):
    conn = get_connection()
    try:
        fields = {}
        for field_name in ["title", "status", "description", "due_date", "end_date", "event_type", "categories"]:
            val = getattr(update, field_name)
            if val is not None:
                fields[field_name] = val
        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        set_clause = ", ".join(f"{k} = ?" for k in fields)
        values = list(fields.values()) + [event_id]
        cursor = conn.execute(f"UPDATE calendar_events SET {set_clause} WHERE id = ?", values)
        conn.commit()
    finally:
        conn.close()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"updated": event_id}


@router.delete("/{event_id}")
async def delete_event(event_id: str):
    conn = get_connection()
    try:
        cursor = conn.execute("DELETE FROM calendar_events WHERE id = ?", (event_id,))
        conn.commit()
    finally:
        conn.close()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"deleted": event_id}
