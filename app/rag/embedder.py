"""Embedding service for FairInsight legal retrieval."""

from __future__ import annotations

from openai import AsyncOpenAI

from app.core.config import Settings


class FairInsightEmbedder:
    """Generate 1024-dim embeddings through OpenRouter-compatible endpoint."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client = AsyncOpenAI(
            base_url=settings.llm.base_url,
            api_key=settings.llm.api_key,
            default_headers=self._headers,
        )

    @property
    def _headers(self) -> dict[str, str]:
        headers: dict[str, str] = {
            "HTTP-Referer": self._settings.llm.site_url,
            "X-Title": self._settings.llm.app_name,
        }
        if self._settings.llm.organization_id:
            headers["X-Organization-Id"] = self._settings.llm.organization_id
        if self._settings.llm.organization_name:
            headers["X-Organization-Name"] = self._settings.llm.organization_name
        return headers

    async def embed_query(self, text: str) -> list[float]:
        """Embed one query string into a fixed-size vector."""
        response = await self._client.embeddings.create(
            model="text-embedding-3-small",
            input=text,
            dimensions=self._settings.rag.embedding_dimensions,
        )
        return response.data[0].embedding
