"""EmbeddingService — sinh vector bge-m3 1024 chiều cho ingest + query chat.

Hai đường, chọn bằng env EMBED_LOCAL:
  - EMBED_LOCAL=false (mặc định): gọi Ollama /api/embed (batch) như cũ. Cần Ollama
    ngoài chạy bge-m3 (vd local 11434 / tunnel). Có retry vì model nạp lần đầu chậm.
  - EMBED_LOCAL=true: nạp bge-m3 thẳng trong process qua sentence-transformers (CPU,
    cùng thư viện reranker đã dùng) → container "đóng kín", không cần Ollama ngoài.
    Dùng cho image Docker đã pre-download model.

QUAN TRỌNG — tương thích vector: cả hai đường đều là model BAAI/bge-m3, lấy dense
embedding ĐÃ normalize (L2) ⇒ vector 1024 chiều cùng không gian, dùng chung được
với 82k vector bge-m3 đã có trong DB. (DB đang chứa vector từ đường Ollama; đường
local phải normalize_embeddings=True để khớp đầu ra normalize của Ollama.)
"""

from __future__ import annotations

import os

import httpx
from tenacity import retry, stop_after_attempt, wait_fixed

from src.config.settings import settings

# bge-m3 context ~8192 token; cắt text quá dài để tránh 400, và embed theo lô nhỏ.
_MAX_CHARS = 6000
_BATCH = 16

# Bật embed in-process (không gọi Ollama). Đọc thẳng env để KHÔNG phải thêm field
# settings (settings.py do agent khác giữ). Đặt EMBED_LOCAL=true trong container.
_EMBED_LOCAL = os.getenv("EMBED_LOCAL", "false").strip().lower() in ("1", "true", "yes")
# Tên/đường model cho sentence-transformers. Ollama gọi "bge-m3"; ST cần repo HF
# "BAAI/bge-m3" (hoặc đường model đã pre-download trong image). Override qua env.
_LOCAL_MODEL = os.getenv("EMBED_LOCAL_MODEL", "BAAI/bge-m3")

_st_model = None  # SentenceTransformer, nạp 1 lần (lazy) khi EMBED_LOCAL=true


def _get_local_model():
    global _st_model
    if _st_model is None:
        from sentence_transformers import SentenceTransformer

        _st_model = SentenceTransformer(_LOCAL_MODEL, device="cpu")
    return _st_model


def _embed_batch_local(texts: list[str]) -> list[list[float]]:
    model = _get_local_model()
    # normalize_embeddings=True ⇒ vector L2-normalized, cùng dạng output Ollama bge-m3.
    vecs = model.encode(
        [t[:_MAX_CHARS] for t in texts],
        normalize_embeddings=True,
        convert_to_numpy=True,
    )
    return [v.tolist() for v in vecs]


@retry(stop=stop_after_attempt(3), wait=wait_fixed(2))
def _embed_batch_ollama(texts: list[str]) -> list[list[float]]:
    payload = {
        "model": settings.OLLAMA_EMBED_MODEL,
        "input": [t[:_MAX_CHARS] for t in texts],
        "keep_alive": settings.OLLAMA_KEEP_ALIVE,
    }
    with httpx.Client(timeout=180) as client:
        resp = client.post(f"{settings.OLLAMA_BASE_URL}/api/embed", json=payload)
        resp.raise_for_status()
        return resp.json()["embeddings"]


def _embed_batch(texts: list[str]) -> list[list[float]]:
    return _embed_batch_local(texts) if _EMBED_LOCAL else _embed_batch_ollama(texts)


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
