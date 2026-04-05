import time
import uuid
import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from core.config import settings
from routers import hero, agent, strategy, results, deep_dive, output, memory
from models.schemas import StandardResponse

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Rate limiter (uses client IP by default)
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API with AI Service Layer for the Auto Research Platform",
    version=settings.VERSION,
)

# Attach limiter to app state so routers can access it
app.state.limiter = limiter


# Middleware: Request Tracing & Timing
@app.middleware("http")
async def add_process_time_and_trace_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    start_time = time.time()

    # Attach to request state for downstream use
    request.state.request_id = request_id

    logger.info(f"Incoming Request={request.method} Path={request.url.path} ID={request_id}")

    try:
        response = await call_next(request)
    except Exception as e:
        raise e

    process_time = time.time() - start_time
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = str(process_time)

    logger.info(f"Completed Request={request.method} Path={request.url.path} ID={request_id} Status={response.status_code} Time={process_time:.4f}s")

    return response


# Global Exception Handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.error(f"HTTPException ID={getattr(request.state, 'request_id', 'Unknown')} Details={exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "data": None, "error": str(exc.detail)},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation Error ID={getattr(request.state, 'request_id', 'Unknown')} Details={exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"success": False, "data": None, "error": "Invalid request payload format."},
    )


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    logger.warning(f"Rate limit exceeded ID={getattr(request.state, 'request_id', 'Unknown')} Client={get_remote_address(request)}")
    return JSONResponse(
        status_code=429,
        content={"success": False, "data": None, "error": "Too many requests. Please slow down."},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled Exception ID={getattr(request.state, 'request_id', 'Unknown')} Error={str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "data": None, "error": "Internal Server Error. Please contact support."},
    )


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(hero.router, prefix="/api/hero", tags=["Hero"])
app.include_router(agent.router, prefix="/api/agent", tags=["Agent Process"])
app.include_router(strategy.router, prefix="/api/strategy", tags=["Research Strategy"])
app.include_router(results.router, prefix="/api/results", tags=["Results Dashboard"])
app.include_router(deep_dive.router, prefix="/api/deep-dive", tags=["Deep Dive"])
app.include_router(output.router, prefix="/api/output", tags=["Output Generator"])
app.include_router(memory.router, prefix="/api/memory", tags=["Memory Section"])


@app.get("/", response_model=StandardResponse[dict], summary="Health Check")
def read_root():
    return StandardResponse(
        success=True,
        data={"status": "ok", "message": "Auto Research Bot Backend is Running!"},
    )
