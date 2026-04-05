from fastapi import APIRouter, Request
from pydantic import BaseModel, Field
import uuid
from slowapi import Limiter
from slowapi.util import get_remote_address
from models.schemas import StandardResponse
from services import research
from core.config import settings

router = APIRouter()

limiter = Limiter(key_func=get_remote_address)


class HeroStartRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=3,
        max_length=500,
        description="The research query to investigate",
        examples=["Impact of quantum computing on cryptography"],
    )


class HeroStatusResponse(BaseModel):
    status: str
    message: str
    active_agents: int


@router.get("/status", response_model=StandardResponse[HeroStatusResponse], summary="Hero Status", response_description="Returns the current readiness state of the AI platform")
async def get_hero_status():
    """Check backend status to display in the hero section."""
    data = HeroStatusResponse(
        status="online",
        message="Auto Research System Ready.",
        active_agents=0,
    )
    return StandardResponse(success=True, data=data)


@router.post("/start-research", response_model=StandardResponse[dict], summary="Start Research", response_description="Triggers the AI agent to begin researching the provided query")
@limiter.limit(settings.RATE_LIMIT)
async def start_research(request: Request, body: HeroStartRequest):
    """Endpoint to initiate a new research topic from the hero input."""
    task_id = str(uuid.uuid4())
    result_data = await research.run_agent(body.query, task_id)
    return StandardResponse(success=True, data=result_data, error=None)
