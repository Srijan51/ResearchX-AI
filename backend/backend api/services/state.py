"""
State management: SQLite persistence + in-memory runtime state.

- DB: stores tasks with timestamps for real metric computation
- In-memory: tracks asyncio task handles (for cancellation) and log queues (for WebSocket streaming)
"""

import sqlite3
import os
import json
import asyncio
from datetime import datetime
from typing import Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "researchx.db")


# ─── In-memory runtime state (not persisted) ─────────────────────────────────

# asyncio.Task handles for background AI processing (key = task_id)
_running_tasks: dict[str, asyncio.Task] = {}

# asyncio.Queue for streaming real-time logs per task (key = task_id)
_log_queues: dict[str, asyncio.Queue] = {}


def register_task_handle(task_id: str, handle: asyncio.Task):
    _running_tasks[task_id] = handle


def cancel_task_handle(task_id: str) -> bool:
    """Cancel a running background task. Returns True if cancelled."""
    handle = _running_tasks.pop(task_id, None)
    if handle and not handle.done():
        handle.cancel()
        return True
    return False


def remove_task_handle(task_id: str):
    _running_tasks.pop(task_id, None)


def get_log_queue(task_id: str) -> asyncio.Queue:
    """Get or create a log queue for a task."""
    if task_id not in _log_queues:
        _log_queues[task_id] = asyncio.Queue()
    return _log_queues[task_id]


async def push_log(task_id: str, message: str):
    """Push a log message to the task's queue (non-blocking)."""
    queue = get_log_queue(task_id)
    await queue.put(message)


def cleanup_log_queue(task_id: str):
    _log_queues.pop(task_id, None)


# ─── SQLite Database Layer ────────────────────────────────────────────────────

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")  # Safe concurrent reads/writes
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            task_id TEXT PRIMARY KEY,
            query TEXT NOT NULL,
            status TEXT DEFAULT 'initializing',
            created_at TEXT NOT NULL,
            started_at TEXT,
            completed_at TEXT,
            progress INTEGER DEFAULT 0,
            results_json TEXT,
            strategy_json TEXT,
            deep_dive_json TEXT
        )
    """)

    # Migrate: add columns if they don't exist (safe for existing DBs)
    existing_cols = {row[1] for row in cursor.execute("PRAGMA table_info(tasks)").fetchall()}
    if "started_at" not in existing_cols:
        cursor.execute("ALTER TABLE tasks ADD COLUMN started_at TEXT")
    if "completed_at" not in existing_cols:
        cursor.execute("ALTER TABLE tasks ADD COLUMN completed_at TEXT")

    conn.commit()
    conn.close()


# Initialize on import
init_db()


def create_task(task_id: str, query: str):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_connection()
    conn.execute(
        "INSERT INTO tasks (task_id, query, status, created_at, progress) VALUES (?, ?, 'initializing', ?, 0)",
        (task_id, query, now),
    )
    conn.commit()
    conn.close()
    return {"task_id": task_id, "query": query, "status": "initializing", "created_at": now, "progress": 0}


def get_task(task_id: str) -> Optional[dict]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM tasks WHERE task_id = ?", (task_id,)).fetchone()
    conn.close()
    if not row:
        return None
    task = dict(row)
    # Parse JSON fields
    task["results"] = json.loads(task["results_json"]) if task.get("results_json") else None
    task["strategy"] = json.loads(task["strategy_json"]) if task.get("strategy_json") else []
    task["deep_dive"] = json.loads(task["deep_dive_json"]) if task.get("deep_dive_json") else {}
    return task


def update_task(task_id: str, **kwargs):
    conn = get_connection()
    for key, value in kwargs.items():
        if key in ("results", "strategy", "deep_dive"):
            col = f"{key}_json"
            conn.execute(f"UPDATE tasks SET {col} = ? WHERE task_id = ?", (json.dumps(value), task_id))
        elif key in ("status", "progress", "started_at", "completed_at"):
            conn.execute(f"UPDATE tasks SET {key} = ? WHERE task_id = ?", (value, task_id))
    conn.commit()
    conn.close()


def get_history():
    conn = get_connection()
    rows = conn.execute("SELECT task_id, query, created_at FROM tasks ORDER BY created_at DESC").fetchall()
    conn.close()
    return [{"task_id": r["task_id"], "query": r["query"], "date": r["created_at"]} for r in rows]


def delete_task(task_id: str):
    conn = get_connection()
    conn.execute("DELETE FROM tasks WHERE task_id = ?", (task_id,))
    conn.commit()
    conn.close()
    # Also clean up runtime state
    cancel_task_handle(task_id)
    cleanup_log_queue(task_id)
