# -*- coding: utf-8 -*-
"""LawyerState — state chung cho LawyerGraph (agent luật sư IRAC).

Mỗi node trả partial state, LangGraph merge. total=False → mọi field optional.
Belief piggyback vào ChatMessage.state_snapshot (JSONB) qua session_loader/persist.
"""
from __future__ import annotations

from typing import Optional, TypedDict


class LawyerState(TypedDict, total=False):
    # --- input ---
    session_id: str
    user_id: Optional[str]
    question: str                    # câu hỏi/vụ việc (ngôn ngữ đời thường)
    history_snaps: list[dict]        # state_snapshot các lượt cũ (để load belief)

    # --- [I] issue + belief phiên ---
    belief: dict                     # facts + độ chắc + missing + hypotheses + domains
    missing: list[dict]              # dữ kiện còn thiếu (từ clarify gate)

    # --- [GATE] hỏi-ngược ---
    asked: bool                      # có hỏi lại user không
    msg_type: str                    # answer | clarification

    # --- [R] rule + [A] application ---
    evidence: list[dict]             # căn cứ đã gom (researcher + multihop + rerank)
    conditions: dict                 # bảng điều kiện được/bị_phạt/trường_hợp

    # --- [C] conclusion ---
    answer: str                      # câu trả lời cuối (hoặc câu hỏi-ngược)
    citation_check: dict             # hậu kiểm citation DB {grounded, suspect, n_suspect}

    # --- trace ---
    steps: list[dict]                # log từng node
    latency_s: float
