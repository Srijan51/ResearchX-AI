from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
from pydantic import BaseModel
import asyncio
from models.schemas import StandardResponse
from services import research

router = APIRouter()

class StrategyStep(BaseModel):
    id: int
    action: str
    description: str

@router.get("/{task_id}", response_model=StandardResponse[List[StrategyStep]], summary="Get Task Strategy", response_description="Returns the breakdown of AI's planned tasks")
async def get_strategy(task_id: str):
    """Retrieve the AI's internal reasoning and planned steps."""
    strategy_data = await research.get_strategy_for_task(task_id)
    
    if not strategy_data:
        return StandardResponse(success=False, error="Strategy not ready")
        
    # Map the dict from the service into StrategyStep models
    steps = [StrategyStep(**step_data) for step_data in strategy_data]
        
    return StandardResponse(success=True, data=steps)

@router.websocket("/{task_id}/logs")
async def strategy_logs_stream(websocket: WebSocket, task_id: str):
    """WebSocket for real-time 'AI Thinking' logs."""
    await websocket.accept()
    try:
        mock_logs = [
            f"[THINKING] Processing '{task_id}'...",
            f"[ACTION] Requesting LLM tool call...",
        ]
        for log in mock_logs:
            await asyncio.sleep(1.5)
            await websocket.send_text(log)
    except WebSocketDisconnect:
        pass
