"""Local JWT authentication — no external auth providers."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
import uuid
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, Request

from ..config import JWT_SECRET, JWT_EXPIRY_HOURS
from ..database import get_connection


def _hash_password(password: str) -> str:
    """PBKDF2-SHA256 with 100k iterations."""
    salt = uuid.uuid4().hex
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return f"{salt}${h.hex()}"


def _verify_password(password: str, stored: str) -> bool:
    salt, hashed = stored.split("$", 1)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return hmac.compare_digest(h.hex(), hashed)


def create_token(user_id: str, role: str = "user") -> str:
    header = base64.urlsafe_b64encode(
        json.dumps({"alg": "HS256", "typ": "JWT"}).encode()
    ).decode().rstrip("=")

    payload_data = {
        "sub": user_id,
        "role": role,
        "iat": int(time.time()),
        "exp": int(time.time()) + JWT_EXPIRY_HOURS * 3600,
    }
    payload = base64.urlsafe_b64encode(
        json.dumps(payload_data).encode()
    ).decode().rstrip("=")

    signature = hmac.new(
        JWT_SECRET.encode(), f"{header}.{payload}".encode(), "sha256"
    ).hexdigest()

    return f"{header}.{payload}.{signature}"


def verify_token(token: str) -> dict:
    parts = token.split(".")
    if len(parts) != 3:
        raise HTTPException(status_code=401, detail="Invalid token format")

    header, payload, signature = parts
    expected = hmac.new(
        JWT_SECRET.encode(), f"{header}.{payload}".encode(), "sha256"
    ).hexdigest()

    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=401, detail="Invalid token signature")

    # Pad base64 if needed
    padded = payload + "=" * (4 - len(payload) % 4)
    data = json.loads(base64.urlsafe_b64decode(padded))

    if data.get("exp", 0) < time.time():
        raise HTTPException(status_code=401, detail="Token expired")

    return data


async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer token required")
    return verify_token(auth[7:])


def register_user(username: str, password: str, role: str = "user") -> dict:
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    password_hash = _hash_password(password)

    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, username, password_hash, role, now),
        )
        conn.commit()
    except Exception:
        conn.close()
        raise HTTPException(status_code=409, detail="Username already exists")
    finally:
        conn.close()

    return {"id": user_id, "username": username, "role": role, "created_at": now}


def authenticate_user(username: str, password: str) -> dict | None:
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    finally:
        conn.close()

    if not row:
        return None
    if not _verify_password(password, row["password_hash"]):
        return None

    return {"id": row["id"], "username": row["username"], "role": row["role"]}
