from fastapi import APIRouter
from typing import List, Dict, Any
from models.schemas import StandardResponse
from services.state import get_history, delete_task

router = APIRouter()

@router.get("/history", response_model=StandardResponse[List[Dict[str, Any]]], summary="Get Chat History")
async def get_history_route():
    """Retrieve a list of past research tasks from SQLite."""
    data = get_history()
    return StandardResponse(success=True, data=data)

@router.get("/context/{task_id}", response_model=StandardResponse[dict], summary="Reload Past Context")
async def get_context(task_id: str):
    from services.state import get_task
    task = get_task(task_id)
    data = {"task_id": task_id, "saved_context": str(task) if task else "Not found"}
    return StandardResponse(success=True, data=data)

@router.delete("/{task_id}", response_model=StandardResponse[dict], summary="Clear Workspace Memory")
async def delete_memory(task_id: str):
    delete_task(task_id)
    return StandardResponse(success=True, data={"message": "Deleted"})
