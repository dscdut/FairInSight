"""Route agent luật sư — LangGraph IRAC: issue → gate → hypothesis → rule →
auditor → condition → conclusion. Endpoint riêng, KHÔNG đụng /chat."""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends

from src.api.core.auth import user_id_from_token
from src.schema.dto.lawyer import LawyerRequest
from src.workflows.lawyer_graph import run_lawyer

router = APIRouter(prefix="/api/v1", tags=["lawyer"])


@router.post("/lawyer")
async def lawyer(
    req: LawyerRequest,
    token_user_id: Optional[str] = Depends(user_id_from_token),
) -> dict:
    """Tư vấn qua agent luật sư (IRAC). Trả JSON gồm câu trả lời + bằng chứng.

    `msg_type` = 'clarify' khi agent hỏi-ngược (thiếu dữ kiện chặn) → answer là câu
    hỏi làm rõ; = 'answer' khi phân tích đầy đủ. `session_id` giữ ngữ cảnh phiên.
    `user_id` ưu tiên JWT hơn req.user_id.
    """
    session_id = req.session_id or f"law-{uuid.uuid4().hex[:12]}"
    user_id = token_user_id or req.user_id
    result = await run_lawyer(
        req.message,
        session_id=session_id,
        user_id=user_id,
    )
    return {
        "session_id": session_id,
        "answer": result.get("answer"),
        "msg_type": result.get("msg_type"),
        "missing": result.get("missing", []),
        "conditions": result.get("conditions", {}),
        "citations": result.get("citation_check", {}),
        "latency_s": result.get("latency_s"),
    }
