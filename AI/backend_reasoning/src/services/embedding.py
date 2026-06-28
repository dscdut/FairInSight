"""EmbeddingService — gọi Ollama bge-m3 sinh vector 1024 chiều.

Dùng /api/embed (batch). Có retry vì model nạp lần đầu có thể chậm.
"""

from __future__ import annotations

import httpx
from tenacity import retry, stop_after_attempt, wait_fixed

from src.config.settings import settings


# bge-m3 context ~8192 token; cắt text quá dài để tránh 400, và embed theo lô nhỏ.
_MAX_CHARS = 6000
_BATCH = 16


@retry(stop=stop_after_attempt(3), wait=wait_fixed(2))
def _embed_batch(texts: list[str]) -> list[list[float]]:
    payload = {
        "model": settings.OLLAMA_EMBED_MODEL,
        "input": [t[:_MAX_CHARS] for t in texts],
        "keep_alive": settings.OLLAMA_KEEP_ALIVE,
    }
    with httpx.Client(timeout=180) as client:
        resp = client.post(f"{settings.OLLAMA_BASE_URL}/api/embed", json=payload)
        resp.raise_for_status()
        return resp.json()["embeddings"]


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Sinh embedding cho danh sách text (chia lô nhỏ). Trả list vector cùng thứ tự."""
    out: list[list[float]] = []
    for i in range(0, len(texts), _BATCH):
        out.extend(_embed_batch(texts[i : i + _BATCH]))
    return out


def embed_one(text: str) -> list[float]:
    """Sinh embedding cho một text (dùng ở query chat)."""
    return embed_texts([text])[0]


def embed_chunk_drafts(chunk_drafts: list, do_embed: bool = True) -> list:
    """Service-level: nhận chunk drafts → trả list embedding cùng thứ tự.

    do_embed=False hoặc rỗng → trả [None]*n. Node chỉ gọi, không tự check điều kiện.
    """
    if not chunk_drafts or not do_embed:
        return [None] * len(chunk_drafts)
    return embed_texts([c.chunk_text for c in chunk_drafts])
