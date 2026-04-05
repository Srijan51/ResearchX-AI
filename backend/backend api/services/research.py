"""
Research orchestration service.

Coordinates the AI pipeline (via pluggable AIProvider) and manages task lifecycle.
This is the bridge between routers and AI — routers never call AI directly.
"""

import asyncio
import logging
from datetime import datetime

from core.config import settings
from services.ai_interface import AIProvider
from services.ai_provider_ollama import OllamaProvider
from services.state import (
    create_task, get_task, update_task,
    register_task_handle, remove_task_handle,
    push_log,
)

logger = logging.getLogger(__name__)

# ─── Provider Initialization ─────────────────────────────────────────────────
# Switch this to your partner's provider when ready:
#   from services.ai_provider_custom import CustomPipelineProvider
#   _provider = CustomPipelineProvider()

_provider: AIProvider = OllamaProvider()


def get_provider() -> AIProvider:
    """Return the active AI provider instance."""
    return _provider


# ─── Public API (called by routers) ──────────────────────────────────────────

async def run_agent(query: str, task_id: str) -> dict:
    """Start a research task and kick off AI processing in the background."""
    create_task(task_id, query)
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    update_task(task_id, status="processing", started_at=now)

    # Fire background task and track the handle for cancellation
    handle = asyncio.create_task(_ai_processing(task_id, query))
    register_task_handle(task_id, handle)

    return {
        "task_id": task_id,
        "query": query,
        "status": "processing",
        "estimated_time_seconds": 15,
    }


async def get_strategy_for_task(task_id: str) -> list:
    task = get_task(task_id)
    if task and task.get("strategy"):
        return task["strategy"]
    return []


async def answer_followup(task_id: str, question: str) -> str:
    """Answer a follow-up question using the research context."""
    task = get_task(task_id)
    context = ""
    if task:
        results = task.get("results") or {}
        deep_dive = task.get("deep_dive") or {}
        context = (
            f"Research query: {task['query']}\n"
            f"Summary: {results.get('summary', '')}\n"
            f"Deep dive: {deep_dive.get('content', '')}"
        )

    provider = get_provider()
    return await provider.answer_followup(context, question)


# ─── Background Processing Pipeline ──────────────────────────────────────────

async def _ai_processing(task_id: str, query: str):
    """
    Background task that calls the AI provider to generate strategy, results,
    and deep-dive content. Emits progress updates and real-time logs.
    """
    provider = get_provider()

    try:
        # --- 1. STRATEGY (0% → 40%) ---
        update_task(task_id, progress=10)
        await push_log(task_id, f"[INIT] Starting research pipeline for: {query}")
        await push_log(task_id, "[STRATEGY] Generating research strategy...")

        strategy = await provider.generate_strategy(query)
        update_task(task_id, strategy=strategy, progress=35)
        await push_log(task_id, f"[STRATEGY] Strategy generated — {len(strategy)} steps planned.")

        # --- 2. RESULTS (40% → 70%) ---
        update_task(task_id, progress=40)
        await push_log(task_id, "[RESULTS] Analyzing data and generating findings...")

        results = await provider.generate_results(query)
        update_task(task_id, results=results, progress=65)
        findings_count = len(results.get("key_findings", []))
        await push_log(task_id, f"[RESULTS] Analysis complete — {findings_count} key findings identified.")

        # --- 3. DEEP DIVE (70% → 100%) ---
        update_task(task_id, progress=70)
        await push_log(task_id, "[DEEP DIVE] Generating in-depth analysis and citations...")

        deep_dive = await provider.generate_deep_dive(query)
        citations_count = len(deep_dive.get("citations", []))
        await push_log(task_id, f"[DEEP DIVE] Deep dive complete — {citations_count} citations found.")

        # --- DONE ---
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        update_task(task_id, deep_dive=deep_dive, status="completed", progress=100, completed_at=now)
        await push_log(task_id, "[COMPLETE] Research pipeline finished successfully.")
        await push_log(task_id, "__END__")  # Sentinel for WebSocket consumers

    except asyncio.CancelledError:
        update_task(task_id, status="cancelled")
        await push_log(task_id, "[CANCELLED] Research pipeline was stopped by user.")
        await push_log(task_id, "__END__")
        logger.info(f"Task {task_id} was cancelled.")

    except Exception as e:
        update_task(task_id, status="error")
        await push_log(task_id, f"[ERROR] Pipeline failed: {str(e)}")
        await push_log(task_id, "__END__")
        logger.exception(f"AI processing failed for task {task_id}: {e}")

    finally:
        remove_task_handle(task_id)
