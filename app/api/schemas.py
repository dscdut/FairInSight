"""Pydantic v2 request/response schemas for FairInsight chat API."""

from __future__ import annotations

from typing import Any, Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints
from typing import Literal


StrictShortText = Annotated[
    str,
    StringConstraints(strict=True, strip_whitespace=True, min_length=1, max_length=128),
]
StrictUserQuery = Annotated[
    str,
    StringConstraints(strict=True, strip_whitespace=True, min_length=1, max_length=8000),
]
StrictIntent = Annotated[
    str,
    StringConstraints(strict=True, strip_whitespace=True, min_length=1, max_length=64),
]
StrictResponseText = Annotated[
    str,
    StringConstraints(strict=True, strip_whitespace=True, min_length=1, max_length=20000),
]


class ChatRequest(BaseModel):
    """Chat request payload consumed by the LegalOrchestrator."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    session_id: StrictShortText
    user_query: StrictUserQuery
    incognito_mode: bool = Field(default=False, strict=True)


class ChatResponse(BaseModel):
    """Chat response payload returned to the Next.js frontend.

    Fields:
    - status: Outcome of the orchestrator execution (success, escalated, error).
    - intent: Determined user intent.
    - final_response: Generated answer.
    - is_manipulation_attempt: Whether a manipulation attempt was detected.
    - citations: List of citation dicts.
    """

    model_config = ConfigDict(extra="forbid", frozen=True)

    status: Literal["success", "escalated", "error"] = Field(default="success", description="Result status of the graph execution")
    intent: StrictIntent
    final_response: StrictResponseText
    is_manipulation_attempt: bool = Field(default=False, description="Flag indicating adversarial manipulation detection")
    citations: list[dict[str, Any]] = Field(default_factory=list)
