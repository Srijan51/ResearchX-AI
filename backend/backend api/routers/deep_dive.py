from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
from models.schemas import StandardResponse
from services.state import get_task
from services.research import answer_followup

router = APIRouter()

class DeepDiveExploreRequest(BaseModel):
    task_id: str
    topic_id: str
    question: str

@router.get("/{task_id}/{topic_id}", response_model=StandardResponse[Dict[str, Any]], summary="Topic Deep Dive Breakdown")
async def get_deep_dive(task_id: str, topic_id: str):
    """Fetch granular, in-depth research data."""
    task = get_task(task_id)
    if not task or not task.get("deep_dive"):
        return StandardResponse(success=False, error="Deep dive not ready")
    
    data = task["deep_dive"].copy()
    data["task_id"] = task_id
    data["topic_id"] = topic_id
    data["title"] = f"Deep Dive Context for {task['query']}"
    return StandardResponse(success=True, data=data)

@router.post("/explore", response_model=StandardResponse[Dict[str, Any]], summary="Follow-up Q&A")
async def explore_followup(request: DeepDiveExploreRequest):
    """Ask follow-up questions answered by Gemini using the research context."""
    answer = await answer_followup(request.task_id, request.question)
    return StandardResponse(success=True, data={"response": answer})
