"""Route chat — LangGraph: RAG Agent (lawyer_graph: IRAC + ReAct)."""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends

from src.api.core.auth import user_id_from_token
from src.schema.dto.chat import ChatRequest
from src.workflows.lawyer_graph import run_lawyer

router = APIRouter(prefix="/api/v1", tags=["chat"])


@router.post("/chat")
async def chat(
    req: ChatRequest,
    token_user_id: Optional[str] = Depends(user_id_from_token),
) -> dict:
    """Chat qua RAG Agent (lawyer_graph: IRAC + ReAct). Trả JSON.

    `session_id` để giữ ngữ cảnh hội thoại (follow-up). `user_id` lấy từ JWT hoặc req.user_id.
    """
    session_id = req.session_id or f"sess-{uuid.uuid4().hex[:12]}"
    user_id = token_user_id or req.user_id
    result = await run_lawyer(
        question=req.message,
        session_id=session_id,
        user_id=user_id,
    )
    
    msg_type = result.get("msg_type") or "answer"
    mode = "clarification" if msg_type in ("clarify", "clarification") else "deep_reasoning"
    
    belief = result.get("belief") or {}
    domains = belief.get("domains_active") or []
    domain = domains[0] if domains else None

    citation_check = result.get("citation_check") or {}
    citations = citation_check.get("grounded", [])

    return {
        "session_id": session_id,
        "answer": result.get("answer"),
        "mode": mode,
        "domain": domain,
        "citations": citations,
        "conditions": result.get("conditions", {}),
        "missing": result.get("missing", []),
        "latency_s": result.get("latency_s"),
    }
