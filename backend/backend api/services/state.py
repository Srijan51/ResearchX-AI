import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "researchx.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
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
            progress INTEGER DEFAULT 0,
            results_json TEXT,
            strategy_json TEXT,
            deep_dive_json TEXT
        )
    """)
    conn.commit()
    conn.close()

# Initialize on import
init_db()

def create_task(task_id: str, query: str):
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_connection()
    conn.execute(
        "INSERT INTO tasks (task_id, query, status, created_at, progress) VALUES (?, ?, 'initializing', ?, 0)",
        (task_id, query, created_at)
    )
    conn.commit()
    conn.close()
    return {"task_id": task_id, "query": query, "status": "initializing", "created_at": created_at, "progress": 0}

def get_task(task_id: str):
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
        elif key in ("status", "progress"):
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
