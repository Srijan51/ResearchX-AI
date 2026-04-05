from fastapi import APIRouter
from typing import Dict, Any
from models.schemas import StandardResponse
from services.state import get_task
from datetime import datetime

router = APIRouter()


@router.get("/{task_id}", response_model=StandardResponse[Dict[str, Any]], summary="Get Task Results", response_description="Fetch summary and key findings mapped to dashboard formats")
async def get_results(task_id: str):
    """Fetch high-level summary and key findings of a research task."""
    task = get_task(task_id)
    if not task or not task.get("results"):
        return StandardResponse(success=False, error="Results not ready")

    data = task["results"].copy()
    data["task_id"] = task_id
    return StandardResponse(success=True, data=data)


@router.get("/{task_id}/metrics", response_model=StandardResponse[Dict[str, Any]], summary="Get Task Metrics", response_description="Fetch numeric stat cards for dashboard graphs")
async def get_metrics(task_id: str):
    """Fetch quantitative metrics computed from real task data."""
    task = get_task(task_id)

    # --- Real time_taken from DB timestamps ---
    time_taken = 0.0
    if task:
        started = task.get("started_at")
        completed = task.get("completed_at")
        if started and completed:
            try:
                t_start = datetime.strptime(started, "%Y-%m-%d %H:%M:%S")
                t_end = datetime.strptime(completed, "%Y-%m-%d %H:%M:%S")
                time_taken = round((t_end - t_start).total_seconds(), 1)
            except ValueError:
                time_taken = 0.0
        elif started:
            # Still running — compute elapsed time so far
            try:
                t_start = datetime.strptime(started, "%Y-%m-%d %H:%M:%S")
                time_taken = round((datetime.now() - t_start).total_seconds(), 1)
            except ValueError:
                time_taken = 0.0

    # --- Real sources count from deep_dive citations ---
    sources = 0
    if task and task.get("deep_dive"):
        sources = len(task["deep_dive"].get("citations", []))

    # --- Confidence: based on actual completion + data richness ---
    confidence = 0.0
    if task:
        if task["status"] == "completed":
            # Base confidence from having all three data stages
            base = 0.7
            if task.get("strategy"):
                base += 0.1
            if task.get("results"):
                base += 0.1
            if task.get("deep_dive") and task["deep_dive"].get("content"):
                base += 0.1
            confidence = round(min(base, 1.0), 2)
        elif task["status"] == "processing":
            confidence = round(task.get("progress", 0) / 100 * 0.6, 2)

    data = {
        "sources_analyzed": sources,
        "time_taken_seconds": time_taken,
        "confidence_score": confidence,
    }
    return StandardResponse(success=True, data=data)
