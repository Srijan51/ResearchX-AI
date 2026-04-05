from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
from pydantic import BaseModel
import asyncio
from models.schemas import StandardResponse
from services import research
from services.state import get_log_queue

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

    steps = [StrategyStep(**step_data) for step_data in strategy_data]
    return StandardResponse(success=True, data=steps)


@router.websocket("/{task_id}/logs")
async def strategy_logs_stream(websocket: WebSocket, task_id: str):
    """WebSocket that streams real-time processing logs from the AI pipeline."""
    await websocket.accept()
    queue = get_log_queue(task_id)
    try:
        while True:
            try:
                # Wait for a log message (with timeout to keep connection alive)
                message = await asyncio.wait_for(queue.get(), timeout=30.0)
            except asyncio.TimeoutError:
                # Send a heartbeat to keep the connection alive
                await websocket.send_text("[HEARTBEAT] Pipeline still running...")
                continue

            if message == "__END__":
                await websocket.send_text("[DONE] Pipeline finished.")
                break

            await websocket.send_text(message)
    except WebSocketDisconnect:
        pass
