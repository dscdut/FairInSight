# -*- coding: utf-8 -*-
"""Rerank toàn cục evidence theo câu gốc (cross-encoder) rồi giữ keep tốt nhất.
Tách từ _research/variants/common.py (_rerank_global) — bỏ phần downstream nặng."""
from __future__ import annotations

import asyncio

from src.config.settings import settings
from src.services import reranker


async def rerank_global(question: str, evidence: list[dict], keep: int) -> list[dict]:
    """Rerank TOÀN CỤC evidence theo câu gốc rồi cắt keep. Cross-encoder chấm
    (câu gốc, content) → giữ keep cao điểm nhất. Lỗi reranker → giữ nguyên thứ tự."""
    if not settings.RERANK_ENABLED or len(evidence) <= keep:
        return evidence[:keep]
    try:
        scores = await asyncio.to_thread(
            reranker.rerank, question,
            [e.get("content") or e.get("path_text") or "" for e in evidence])
        ranked = [e for _, e in sorted(zip(scores, evidence), key=lambda p: p[0], reverse=True)]
        return ranked[:keep]
    except Exception:
        return evidence[:keep]
