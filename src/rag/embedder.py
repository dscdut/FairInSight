"""Embedding service for FairInsight RAG pipeline (1024 dimensions)."""

from __future__ import annotations

import os
from typing import Optional

from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential


class Embedder:
    """Generate embeddings via OpenAI-compatible APIs (OpenRouter by default)."""

    def __init__(
        self,
        model: Optional[str] = None,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        dimensions: Optional[int] = None,
    ) -> None:
        self.model = model or os.getenv("RAG_EMBEDDING_MODEL", "text-embedding-3-small")
        self.api_key = api_key or os.getenv("LLM_API_KEY") or os.getenv("OPENAI_API_KEY", "")
        self.base_url = base_url or os.getenv("LLM_BASE_URL") or "https://api.openai.com/v1"
        self.dimensions = dimensions or int(os.getenv("RAG_EMBEDDING_DIMENSIONS", "1024"))

        if not self.api_key:
            raise ValueError("LLM_API_KEY or OPENAI_API_KEY must be configured for embeddings")

        headers: dict[str, str] = {}
        site_url = os.getenv("LLM_SITE_URL", "")
        app_name = os.getenv("LLM_APP_NAME", "FairInsight")
        if site_url:
            headers["HTTP-Referer"] = site_url
        if app_name:
            headers["X-Title"] = app_name
        org_id = os.getenv("LLM_ORGANIZATION_ID", "")
        org_name = os.getenv("LLM_ORGANIZATION_NAME", "")
        if org_id:
            headers["X-Organization-Id"] = org_id
        if org_name:
            headers["X-Organization-Name"] = org_name

        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
            default_headers=headers or None,
        )

    async def embed(self, text: str) -> list[float]:
        """Embed a single text string."""
        results = await self.embed_batch([text])
        return results[0]

    @retry(wait=wait_exponential(min=1, max=8), stop=stop_after_attempt(3), reraise=True)
    async def _embed_request(self, batch: list[str]) -> list[list[float]]:
        response = await self.client.embeddings.create(
            model=self.model,
            input=batch,
            dimensions=self.dimensions,
        )
        return [item.embedding for item in response.data]

    async def embed_batch(self, texts: list[str], batch_size: int = 100) -> list[list[float]]:
        """Embed multiple texts in batches."""
        if not texts:
            return []

        all_embeddings = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            embeddings = await self._embed_request(batch)
            all_embeddings.extend(embeddings)

        return all_embeddings


# Singleton
_embedder: Optional[Embedder] = None


def get_embedder() -> Embedder:
    """Get or create the embedder singleton."""
    global _embedder
    if _embedder is None:
        _embedder = Embedder()
    return _embedder
