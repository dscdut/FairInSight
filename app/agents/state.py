"""Typed state shared across FairInsight LangGraph nodes."""

from __future__ import annotations
from typing import Any, TypedDict, Annotated
import operator

class LegalAIState(TypedDict):
    """
    State contract for the 7-node FairInsight Agentic flow.
    Uses Annotated with operator.add for fields that need history/accumulation.
    """
    # Core Identification
    session_id: str
    user_query: str
    
    # NLP & Security (Node 0)
    is_adversarial: bool
    security_flags: list[str]
    
    # Intake & Expansion (Node 1)
    intent: str
    search_query: str  # Formally expanded query
    entities: dict[str, Any]
    
    # Research & Context (Node 2)
    retrieved_laws: list[dict[str, Any]]
    confidence_score: float
    
    # Generation & Review (Nodes 4, 5)
    draft_response: str
    passed_review: bool
    review_feedback: str
    retry_count: Annotated[int, operator.add]
    
    # Final Output (Node 6)
    final_response: str
    
    # Escalation (Node 7)
    case_summary: str
    escalation_required: bool
