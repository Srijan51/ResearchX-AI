"""
Abstract AI Provider interface.

Your partner implements this to plug in their AI pipeline.
The backend routers never touch AI logic directly — everything goes through this contract.
"""

from abc import ABC, abstractmethod
from typing import Optional


class AIProvider(ABC):
    """
    Contract that any AI backend (Ollama, OpenAI, custom LangChain pipeline, etc.) must fulfill.

    Each method has a clearly defined input/output so the API layer and AI layer
    can be developed independently.
    """

    @abstractmethod
    async def generate_strategy(self, query: str) -> list[dict]:
        """
        Generate a research strategy for the given query.

        Returns:
            list of dicts, each with keys:
                - id (int): step number
                - action (str): short title of the step
                - description (str): one-sentence explanation
        Example:
            [{"id": 1, "action": "Semantic Parsing", "description": "Breaking down the query intent."}]
        """
        ...

    @abstractmethod
    async def generate_results(self, query: str) -> dict:
        """
        Generate a research summary and key findings.

        Returns:
            dict with keys:
                - title (str): short findings title
                - summary (str): detailed paragraph of findings
                - key_findings (list[str]): 3-5 bullet-point findings
        """
        ...

    @abstractmethod
    async def generate_deep_dive(self, query: str) -> dict:
        """
        Generate an in-depth deep-dive analysis.

        Returns:
            dict with keys:
                - content (str): detailed paragraph of deep analysis
                - citations (list[str]): list of source references
        """
        ...

    @abstractmethod
    async def answer_followup(self, context: str, question: str) -> str:
        """
        Answer a follow-up question using the given research context.

        Args:
            context: concatenated summary + deep dive text from the task
            question: the user's follow-up question

        Returns:
            A concise 2-3 sentence answer string.
        """
        ...
