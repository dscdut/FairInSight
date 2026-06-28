"""Route chat — LangGraph: router → lookup/deep → citation verifier."""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends

from src.api.core.auth import user_id_from_token
from src.schema.dto.chat import ChatRequest
from src.workflows.chat_graph import run_lookup

router = APIRouter(prefix="/api/v1", tags=["chat"])


@router.post("/chat")
async def chat(
    req: ChatRequest,
    token_user_id: Optional[str] = Depends(user_id_from_token),
) -> dict:
    """Chat qua LangGraph: router → lookup/deep → citation verifier. Trả JSON.

    `session_id` để giữ ngữ cảnh hội thoại (follow-up). `user_id` gắn phiên với
    người dùng: ƯU TIÊN lấy từ JWT (Authorization: Bearer) — token authoritative;
    chỉ fallback `req.user_id` khi không có token (test trực tiếp). `deep_confirmed`
    = True khi user đồng ý chuyển sang phân tích sâu (sau câu hỏi xác nhận).
    """
    session_id = req.session_id or f"sess-{uuid.uuid4().hex[:12]}"
    user_id = token_user_id or req.user_id
    result = await run_lookup(
        session_id=session_id,
        user_message=req.message,
        user_id=user_id,
        deep_confirmed=req.deep_confirmed,
    )
    # domain (lĩnh vực) để FE map sang luật sư: ưu tiên case_frame (deep), không thì topic.
    case_frame = result.get("case_frame") or {}
    domain = case_frame.get("main_domain") or result.get("topic")
    return {
        "session_id": session_id,
        "answer": result.get("final_answer"),
        "mode": result.get("mode"),
        "confidence": result.get("route_confidence"),
        "risk": result.get("risk"),
        "domain": domain,
        "citations": result.get("citations", []),
        "warnings": result.get("warnings", []),
    }
