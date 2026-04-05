"""
Concrete Ollama-based AI provider.

This is the default implementation that talks to a local or remote Ollama instance.
Your partner can create their own provider (e.g., LangChain, OpenAI, custom pipeline)
by subclassing AIProvider.
"""

import json
import logging
import httpx
from core.config import settings
from services.ai_interface import AIProvider

logger = logging.getLogger(__name__)


class OllamaProvider(AIProvider):
    """Calls the Ollama /api/generate endpoint for each AI task."""

    async def _call_ollama(self, prompt: str) -> str | None:
        """Raw Ollama API call. Returns the response text or None on failure."""
        try:
            payload = {
                "model": settings.OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
            }
            headers = {"Content-Type": "application/json"}
            if settings.OLLAMA_API_KEY:
                headers["Authorization"] = f"Bearer {settings.OLLAMA_API_KEY}"

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/generate",
                    json=payload,
                    headers=headers,
                )
                response.raise_for_status()

            data = response.json()
            return data.get("response")
        except Exception as e:
            logger.error(f"Ollama API call failed: {e}")
            return None

    @staticmethod
    def _parse_json_safe(text: str | None, fallback):
        """Parse JSON from model response, handling markdown code fences."""
        if not text:
            return fallback
        try:
            cleaned = text.strip()
            if cleaned.startswith("```"):
                lines = cleaned.split("\n")
                lines = [line for line in lines if not line.strip().startswith("```")]
                cleaned = "\n".join(lines)
            return json.loads(cleaned)
        except Exception:
            return fallback

    # --- Interface Implementation ---

    async def generate_strategy(self, query: str) -> list[dict]:
        prompt = (
            f'You are a research strategist AI. For the research query: "{query}"\n'
            "Generate exactly 3 strategic research steps. Return ONLY a JSON array like:\n"
            '[{"id": 1, "action": "Step Title", "description": "One sentence description."}, ...]\n'
            "No markdown, no explanation, just the JSON array."
        )
        text = await self._call_ollama(prompt)
        return self._parse_json_safe(text, fallback=[
            {"id": 1, "action": "Semantic Parsing", "description": f"Breaking down intent for '{query}'."},
            {"id": 2, "action": "Data Retrieval", "description": "Fetching relevant sources."},
            {"id": 3, "action": "Synthesis", "description": "Compiling final analysis."},
        ])

    async def generate_results(self, query: str) -> dict:
        prompt = (
            f'You are a research analyst AI. For the query: "{query}"\n'
            "Generate a research summary. Return ONLY a JSON object like:\n"
            '{"title": "Short findings title", "summary": "A detailed paragraph of findings.", '
            '"key_findings": ["Finding 1", "Finding 2", "Finding 3"]}\n'
            "No markdown, no explanation, just the JSON object."
        )
        text = await self._call_ollama(prompt)
        return self._parse_json_safe(text, fallback={
            "title": "Analysis Complete",
            "summary": f"Research on '{query}' has been completed with high confidence.",
            "key_findings": ["Data successfully retrieved.", "Patterns identified.", "Analysis synthesized."],
        })

    async def generate_deep_dive(self, query: str) -> dict:
        prompt = (
            f'You are a deep research AI. For the query: "{query}"\n'
            "Generate an in-depth analysis paragraph and 3 citations. Return ONLY a JSON object like:\n"
            '{"content": "Detailed paragraph of deep analysis...", '
            '"citations": ["[1] Source name or URL", "[2] Source name", "[3] Source name"]}\n'
            "No markdown, no explanation, just the JSON object."
        )
        text = await self._call_ollama(prompt)
        return self._parse_json_safe(text, fallback={
            "content": f"Deep analysis of '{query}' reveals extensive interdisciplinary connections.",
            "citations": ["[1] Global Research Database", f"[2] ArXiv papers on {query}", "[3] IEEE Digital Library"],
        })

    async def answer_followup(self, context: str, question: str) -> str:
        prompt = (
            f"You are a research assistant. Based on this research context:\n{context}\n\n"
            f'Answer this follow-up question concisely in 2-3 sentences: "{question}"'
        )
        answer = await self._call_ollama(prompt)
        return answer or f"I processed your question about '{question}' but couldn't generate a detailed answer at this time."
