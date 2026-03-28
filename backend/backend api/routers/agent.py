from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import asyncio
import psutil
from models.schemas import StandardResponse
from services.state import get_task

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
        ram_usage=ram
    )
    return StandardResponse(success=True, data=data)

@router.post("/{task_id}/stop", response_model=StandardResponse[dict], summary="Stop Agent Task")
async def stop_agent(task_id: str):
    return StandardResponse(success=True, data={"message": f"Agent task {task_id} stopped."})

@router.websocket("/{task_id}/stream")
async def agent_status_stream(websocket: WebSocket, task_id: str):
    await websocket.accept()
    try:
        task = get_task(task_id)
        while task and task["status"] != "completed":
            await asyncio.sleep(1)
            await websocket.send_json({"task_id": task_id, "status": task["status"], "progress": task["progress"]})
    except WebSocketDisconnect:
        pass
