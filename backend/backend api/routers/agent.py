from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import asyncio
import psutil
from models.schemas import StandardResponse
from services.state import get_task, cancel_task_handle, get_log_queue

router = APIRouter()


class AgentStatus(BaseModel):
    task_id: str
    status: str
    progress: int
    cpu_usage: float
    ram_usage: float


@router.get("/{task_id}/status", response_model=StandardResponse[AgentStatus], summary="Get Agent Status", response_description="Poll the agent state while it evaluates data")
async def get_agent_status(task_id: str):
    """Poll the current status of the research agent and hardware metrics."""
    task = get_task(task_id)
    if not task:
        return StandardResponse(success=False, error="Task not found")

    cpu = psutil.cpu_percent(interval=None)
    ram = psutil.virtual_memory().percent

    data = AgentStatus(
        task_id=task_id,
        status=task["status"],
        progress=task["progress"],
        cpu_usage=cpu,
        ram_usage=ram,
    )
    return StandardResponse(success=True, data=data)


@router.post("/{task_id}/stop", response_model=StandardResponse[dict], summary="Stop Agent Task")
async def stop_agent(task_id: str):
    """Cancel a running research task."""
    cancelled = cancel_task_handle(task_id)
    if cancelled:
        return StandardResponse(success=True, data={"message": f"Agent task {task_id} cancelled."})
    return StandardResponse(success=True, data={"message": f"Task {task_id} is not running or already finished."})


@router.websocket("/{task_id}/stream")
async def agent_status_stream(websocket: WebSocket, task_id: str):
    """WebSocket that pushes live agent status every second until task completes."""
    await websocket.accept()
    try:
        while True:
            # Re-fetch from DB each iteration for live data
            task = get_task(task_id)
            if not task:
                await websocket.send_json({"error": "Task not found"})
                break

            cpu = psutil.cpu_percent(interval=None)
            ram = psutil.virtual_memory().percent

            await websocket.send_json({
                "task_id": task_id,
                "status": task["status"],
                "progress": task["progress"],
                "cpu_usage": cpu,
                "ram_usage": ram,
            })

            if task["status"] in ("completed", "error", "cancelled"):
                break

            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass
