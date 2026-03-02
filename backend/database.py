import sqlite3
import json
from pathlib import Path
from .config import DB_PATH, DB_ENCRYPTION_KEY, DATA_DIR


def get_connection() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    if DB_ENCRYPTION_KEY:
        conn.execute(f"PRAGMA key = '{DB_ENCRYPTION_KEY}'")
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_connection()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS policies (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            content TEXT NOT NULL,
            version INTEGER DEFAULT 1,
            status TEXT DEFAULT 'draft',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS attestations (
            id TEXT PRIMARY KEY,
            policy_id TEXT NOT NULL,
            attested_by TEXT NOT NULL,
            attested_at TEXT NOT NULL,
            expires_at TEXT,
            notes TEXT,
            FOREIGN KEY (policy_id) REFERENCES policies(id)
        );

        CREATE TABLE IF NOT EXISTS scan_results (
            id TEXT PRIMARY KEY,
            scan_type TEXT NOT NULL,
            input_text TEXT NOT NULL,
            result_json TEXT NOT NULL,
            scanned_at TEXT NOT NULL,
            scanned_by TEXT
        );

        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            actor TEXT NOT NULL,
            action TEXT NOT NULL,
            resource_type TEXT,
            resource_id TEXT,
            data_hash TEXT NOT NULL,
            metadata TEXT
        );

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS calendar_events (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            event_type TEXT NOT NULL,
            due_date TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            policy_id TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (policy_id) REFERENCES policies(id)
        );

        CREATE TABLE IF NOT EXISTS workflow_tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'pending',
            priority TEXT DEFAULT 'medium',
            assigned_to TEXT,
            policy_id TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (policy_id) REFERENCES policies(id)
        );

        CREATE TABLE IF NOT EXISTS queue_items (
            id TEXT PRIMARY KEY,
            item_type TEXT NOT NULL,
            reference_id TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            priority INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            processed_at TEXT
        );
    """)
    conn.commit()
    conn.close()
