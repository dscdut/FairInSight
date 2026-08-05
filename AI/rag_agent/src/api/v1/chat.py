"""Current FairInSight HTTP contract backed by the legacy chat graph."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response, status

from src.api.core.auth import require_user, user_id_from_token
from src.api.core.database import AsyncSessionLocal
from src.api.core.gateway_auth import verify_chat_gateway
from src.schema.chat import (
    ChatResponse,
    ChatSessionCreateResponse,
    ChatSessionDetail,
    ChatSessionListResponse,
    LegalPositioningReport,
)
from src.schema.dto.chat import ChatRequest
from src.services.chat import GraphChatService
from src.services.chat.memory import DatabaseChatMemory
from src.services.chat.memory.chat_memory import (
    SessionNotFoundError,
    SessionOwnershipError,
    TurnInProgressError,
)
from src.services.chat.memory.session_token import sign_session, verify_session

router = APIRouter(prefix="/api/v1", tags=["chat"])
_chat_memory = DatabaseChatMemory(AsyncSessionLocal)
_chat_service = GraphChatService(memory=_chat_memory)


def _anonymous_verified(session_id: str, session_token: str | None) -> bool:
    return verify_session(session_id, session_token)


@router.post("/chat/sessions", response_model=ChatSessionCreateResponse)
async def create_chat_session(
    user_id: Optional[str] = Depends(user_id_from_token),
) -> ChatSessionCreateResponse:
    item = await _chat_memory.create_session(user_id)
    return ChatSessionCreateResponse(
        session_id=item.id,
        session_token=None if user_id else sign_session(item.id),
        title=item.title,
        created_at=item.created_at,
    )


@router.get("/chat/sessions", response_model=ChatSessionListResponse)
async def list_chat_sessions(
    user_id: str = Depends(require_user),
    limit: int = Query(default=50, ge=1, le=100),
) -> ChatSessionListResponse:
    return ChatSessionListResponse(items=await _chat_memory.list_sessions(user_id, limit=limit))


@router.get("/chat/sessions/{session_id}", response_model=ChatSessionDetail)
async def get_chat_session(
    session_id: str,
    user_id: Optional[str] = Depends(user_id_from_token),
    session_token: Optional[str] = Header(default=None, alias="X-Session-Token"),
) -> ChatSessionDetail:
    try:
        item = await _chat_memory.get_session(
            session_id,
            user_id,
            anonymous_verified=_anonymous_verified(session_id, session_token),
        )
        item["session_token"] = None if user_id else sign_session(session_id)
        return ChatSessionDetail.model_validate(item)
    except SessionNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except SessionOwnershipError as exc:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên chat") from exc


@router.delete("/chat/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_session(
    session_id: str,
    user_id: Optional[str] = Depends(user_id_from_token),
    session_token: Optional[str] = Header(default=None, alias="X-Session-Token"),
) -> Response:
    try:
        await _chat_memory.delete_session(
            session_id,
            user_id,
            anonymous_verified=_anonymous_verified(session_id, session_token),
        )
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except SessionNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except SessionOwnershipError as exc:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên chat") from exc


@router.get("/chat/reports/{report_id}", response_model=LegalPositioningReport)
async def get_chat_report(
    report_id: str,
    user_id: Optional[str] = Depends(user_id_from_token),
    session_id: str = Query(...),
    session_token: Optional[str] = Header(default=None, alias="X-Session-Token"),
) -> LegalPositioningReport:
    """Return the canonical owner-scoped report used by PDF and lawyer handoff."""
    try:
        report = await _chat_memory.get_report(
            report_id, session_id, user_id,
            anonymous_verified=_anonymous_verified(session_id, session_token),
        )
        return LegalPositioningReport.model_validate(report)
    except (SessionNotFoundError, SessionOwnershipError) as exc:
        raise HTTPException(status_code=404, detail="Không tìm thấy bản phân tích") from exc


@router.post("/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    user_id: Optional[str] = Depends(user_id_from_token),
    _gateway_verified: None = Depends(verify_chat_gateway),
) -> ChatResponse:
    """Run the fallback chat graph; identity comes only from JWT."""
    try:
        return await _chat_service.run(
            message=req.message,
            session_id=req.session_id,
            user_id=user_id,
            anonymous_token=req.session_token,
            requested_mode=req.requested_mode,
        )
    except SessionOwnershipError as exc:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên chat") from exc
    except SessionNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except TurnInProgressError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
