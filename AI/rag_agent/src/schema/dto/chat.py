"""Request contract for legal chat."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class ChatRequest(BaseModel):
    """Client input; user identity is never accepted from the request body."""

    model_config = ConfigDict(extra="forbid")

    message: str = Field(..., min_length=1, max_length=20_000)
    session_id: str = Field(..., min_length=1, max_length=36)
    session_token: Optional[str] = Field(default=None, max_length=128)
    requested_mode: Literal["auto", "normal", "deep"] = "auto"
