"""Typed state shared across FairInsight LangGraph nodes."""

from __future__ import annotations

from typing import Any, TypedDict


class LegalAIState(TypedDict, total=False):
    """State contract for the four-agent legal orchestration graph."""

    session_id: str
    user_query: str
    incognito_mode: bool

    intent: str
    search_query: str
    domains: list[str]

    query_embedding: list[float]
    retrieved_chunks: list[dict[str, Any]]
    citations: list[dict[str, Any]]

    draft_response: str
    retry_count: int
    review_feedback: str
    passed_review: bool
    final_response: str

    # Security & Escalation
    is_manipulation_attempt: bool
    security_status: str  # e.g., "safe", "manipulation_detected", "escalated"
    escalation_required: bool
    
    should_log_chat: bool
