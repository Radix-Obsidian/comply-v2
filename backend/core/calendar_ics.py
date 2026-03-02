"""ICS calendar import, export, and subscription feed."""

from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from icalendar import Calendar, Event

from ..database import get_connection

router = APIRouter()


@router.post("/import")
async def import_ics(
    file: UploadFile = File(...),
    dry_run: bool = Query(True, description="If true, return preview without importing"),
):
    """Import events from an .ics file.

    With dry_run=true: returns a preview of parsed events.
    With dry_run=false: inserts new events, skips duplicates.
    """
    filename = file.filename or ""
    if not filename.lower().endswith(".ics"):
        raise HTTPException(status_code=400, detail="Only .ics files are supported")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        cal = Calendar.from_ical(content)
    except Exception:
        raise HTTPException(status_code=422, detail="Could not parse .ics file. Ensure it is a valid iCalendar file.")

    # Extract events from VEVENT components
    parsed_events = []
    for component in cal.walk():
        if component.name != "VEVENT":
            continue

        summary = str(component.get("SUMMARY", "Untitled Event"))
        description = str(component.get("DESCRIPTION", "")) if component.get("DESCRIPTION") else ""
        dtstart = component.get("DTSTART")
        dtend = component.get("DTEND")
        uid = str(component.get("UID", ""))
        categories_prop = component.get("CATEGORIES")

        # Parse start date
        if dtstart:
            dt = dtstart.dt
            start_str = dt.isoformat() if hasattr(dt, "isoformat") else str(dt)
        else:
            continue  # Skip events without a start date

        # Parse end date
        end_str = None
        if dtend:
            dt = dtend.dt
            end_str = dt.isoformat() if hasattr(dt, "isoformat") else str(dt)

        # Parse categories
        categories = ""
        if categories_prop:
            if isinstance(categories_prop, list):
                cats = []
                for cat_list in categories_prop:
                    cats.extend(str(c) for c in cat_list.cats if c)
                categories = ", ".join(cats)
            else:
                categories = ", ".join(str(c) for c in categories_prop.cats if c)

        # Generate a UID for duplicate detection
        if not uid:
            uid = hashlib.sha256(f"{summary}{start_str}".encode()).hexdigest()[:24]

        parsed_events.append({
            "uid": uid,
            "title": summary,
            "description": description,
            "start": start_str,
            "end": end_str,
            "categories": categories,
        })

    if not parsed_events:
        raise HTTPException(status_code=422, detail="No events found in the .ics file")

    # Check for duplicates
    conn = get_connection()
    try:
        existing_uids = set()
        rows = conn.execute("SELECT ics_uid FROM calendar_events WHERE ics_uid IS NOT NULL").fetchall()
        for r in rows:
            existing_uids.add(r["ics_uid"])

        for evt in parsed_events:
            evt["already_exists"] = evt["uid"] in existing_uids

        new_events = [e for e in parsed_events if not e["already_exists"]]
        duplicates = len(parsed_events) - len(new_events)

        if dry_run:
            return {
                "events": parsed_events,
                "total": len(parsed_events),
                "new": len(new_events),
                "duplicates": duplicates,
            }

        # Insert new events
        now = datetime.now(timezone.utc).isoformat()
        inserted_ids = []
        for evt in new_events:
            event_id = str(uuid.uuid4())
            conn.execute(
                "INSERT INTO calendar_events (id, title, description, event_type, due_date, end_date, status, categories, ics_uid, created_at) "
                "VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)",
                (event_id, evt["title"], evt["description"], "imported", evt["start"], evt["end"], evt["categories"], evt["uid"], now),
            )
            inserted_ids.append(event_id)
        conn.commit()
    finally:
        conn.close()

    return {
        "imported": len(inserted_ids),
        "skipped_duplicates": duplicates,
        "event_ids": inserted_ids,
    }


@router.get("/export")
async def export_ics(
    status: str | None = None,
    event_type: str | None = None,
    from_date: str | None = None,
    to_date: str | None = None,
):
    """Export calendar events as a downloadable .ics file."""
    cal = _build_calendar(status=status, event_type=event_type, from_date=from_date, to_date=to_date)
    ics_bytes = cal.to_ical()

    return StreamingResponse(
        iter([ics_bytes]),
        media_type="text/calendar",
        headers={"Content-Disposition": "attachment; filename=comply-calendar.ics"},
    )


@router.get("/feed")
async def ics_feed():
    """Serve an ICS subscription feed of all pending events.

    Add this URL to any calendar app (Apple Calendar, Google Calendar, Outlook)
    to subscribe to compliance deadlines on your local network.
    """
    cal = _build_calendar(status="pending")
    # Add subscription-friendly headers
    cal.add("X-WR-CALNAME", "Comply-v2 Compliance")
    cal.add("REFRESH-INTERVAL;VALUE=DURATION", "PT1H")
    ics_bytes = cal.to_ical()

    return StreamingResponse(
        iter([ics_bytes]),
        media_type="text/calendar",
    )


def _build_calendar(
    status: str | None = None,
    event_type: str | None = None,
    from_date: str | None = None,
    to_date: str | None = None,
) -> Calendar:
    """Build an iCalendar object from database events."""
    cal = Calendar()
    cal.add("PRODID", "-//Comply-v2//EN")
    cal.add("VERSION", "2.0")

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
        if from_date:
            query += " AND due_date >= ?"
            params.append(from_date)
        if to_date:
            query += " AND due_date <= ?"
            params.append(to_date)
        query += " ORDER BY due_date ASC"
        rows = conn.execute(query, params).fetchall()
    finally:
        conn.close()

    for row in rows:
        event = Event()
        event.add("SUMMARY", row["title"])
        if row["description"]:
            event.add("DESCRIPTION", row["description"])

        # Parse dates
        try:
            dtstart = datetime.fromisoformat(row["due_date"].replace("Z", "+00:00"))
            event.add("DTSTART", dtstart)
        except (ValueError, AttributeError):
            continue  # Skip events with unparseable dates

        end_date = row["end_date"] if "end_date" in row.keys() else None
        if end_date:
            try:
                dtend = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                event.add("DTEND", dtend)
            except (ValueError, AttributeError):
                pass

        # Categories
        categories = row["categories"] if "categories" in row.keys() else None
        if categories:
            event.add("CATEGORIES", [c.strip() for c in categories.split(",")])

        # UID: use ics_uid if available, otherwise generate from id
        ics_uid = row["ics_uid"] if "ics_uid" in row.keys() else None
        event.add("UID", ics_uid or f"{row['id']}@comply-v2.local")

        event.add("STATUS", "CONFIRMED" if row["status"] == "completed" else "TENTATIVE")
        cal.add_component(event)

    return cal
