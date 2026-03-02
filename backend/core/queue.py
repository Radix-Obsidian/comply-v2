import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from ..database import get_connection

router = APIRouter()


@router.post("/")
async def enqueue(item_type: str, reference_id: str, priority: int = 0):
    """Add an item to the review queue."""
    now = datetime.now(timezone.utc).isoformat()
    item_id = str(uuid.uuid4())
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO queue_items (id, item_type, reference_id, status, priority, created_at) "
            "VALUES (?, ?, ?, 'pending', ?, ?)",
            (item_id, item_type, reference_id, priority, now),
        )
        conn.commit()
    finally:
        conn.close()
    return {"id": item_id, "item_type": item_type, "reference_id": reference_id, "status": "pending"}


@router.get("/")
async def list_queue(status: str = "pending"):
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM queue_items WHERE status = ? ORDER BY priority DESC, created_at ASC",
            (status,),
        ).fetchall()
    finally:
        conn.close()
    return [dict(r) for r in rows]


@router.post("/{item_id}/process")
async def process_item(item_id: str):
    """Mark a queue item as processed."""
    now = datetime.now(timezone.utc).isoformat()
    conn = get_connection()
    try:
        cursor = conn.execute(
            "UPDATE queue_items SET status = 'processed', processed_at = ? WHERE id = ? AND status = 'pending'",
            (now, item_id),
        )
        conn.commit()
    finally:
        conn.close()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Queue item not found or already processed")
    return {"processed": item_id, "processed_at": now}


@router.get("/stats")
async def queue_stats():
    conn = get_connection()
    try:
        pending = conn.execute("SELECT COUNT(*) as cnt FROM queue_items WHERE status = 'pending'").fetchone()["cnt"]
        processed = conn.execute("SELECT COUNT(*) as cnt FROM queue_items WHERE status = 'processed'").fetchone()["cnt"]
    finally:
        conn.close()
    return {"pending": pending, "processed": processed}
