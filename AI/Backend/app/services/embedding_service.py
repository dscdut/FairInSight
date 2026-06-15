import asyncio
from typing import cast, overload
import httpx
from fastapi import HTTPException
from app.utils.settings import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()


class EmbeddingService:
    _instance = None

    def __new__(cls) -> "EmbeddingService":
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
        return cls._instance

    @overload
    async def encode(self, texts: str, task: str | None = None) -> list[float]: ...

    @overload
    async def encode(self, texts: list[str], task: str | None = None) -> list[list[float]]: ...

    async def encode(
        self, texts: list[str] | str, task: str | None = None
    ) -> list[list[float]] | list[float]:
        if not texts:
            return [] if isinstance(texts, list) else [0.0] * settings.embed_dim

        input_texts = [texts] if isinstance(texts, str) else texts

        # Only API-based embeddings (Jina) are supported
        if not settings.jina_api_key:
            logger.error("jina_api_key_missing")
            raise HTTPException(
                status_code=500,
                detail="JINA_API_KEY is not configured. Local embeddings are disabled to save server resources."
            )

        result_embeddings = await self._encode_jina(input_texts, task)

        if isinstance(texts, str):
            return cast(list[float], result_embeddings[0])
        return cast(list[list[float]], result_embeddings)

    async def _encode_jina(self, texts: list[str], task: str | None) -> list[list[float]]:
        # Jina Embeddings API limits batch size or total payload size.
        # We chunk inputs to be safe (e.g., max 100 items per request).
        chunk_size = 100
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.jina_api_key}"
        }
        url = "https://api.jina.ai/v1/embeddings"
        
        result_embeddings: list[list[float]] = [[]] * len(texts)
        
        # We process chunks sequentially to avoid hitting rate limits.
        # Reuse a single AsyncClient instance across batches to optimize performance.
        async with httpx.AsyncClient(timeout=60.0) as client:
            for i in range(0, len(texts), chunk_size):
                batch = texts[i:i + chunk_size]
                
                # If model is not a Jina model, fallback to a valid Jina model
                model_to_use = settings.embed_model if settings.embed_model.startswith("jina-") else "jina-embeddings-v3"
                
                payload = {
                    "model": model_to_use,
                    "task": task or "retrieval.passage",
                    "dimensions": settings.embed_dim,
                    "late_chunking": False,
                    "embedding_type": "float",
                    "input": batch
                }
                logger.info("requesting_jina_embeddings", model=payload["model"], batch_size=len(batch))
                
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code != 200:
                    logger.error("jina_embedding_failed", status_code=response.status_code, body=response.text)
                    response.raise_for_status()
                
                data = response.json()
                records = data.get("data", [])
                for record in records:
                    idx = i + record["index"]
                    result_embeddings[idx] = record["embedding"]
                    
        return result_embeddings


embedding_service = EmbeddingService()
