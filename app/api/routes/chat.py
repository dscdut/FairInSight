"""Chat API route wired to the compiled LegalOrchestrator graph."""

from __future__ import annotations

import logging
from typing import Any, Protocol

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.schemas import ChatRequest, ChatResponse
from app.core.session_store import SessionStore

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["chat"])


class GraphProtocol(Protocol):
    """Protocol for compiled LangGraph objects."""

    async def ainvoke(self, state: dict[str, Any]) -> dict[str, Any]:
        ...


class OrchestratorProtocol(Protocol):
    """Protocol for orchestrator wrapper stored in app.state."""

    graph: GraphProtocol


def get_orchestrator(request: Request) -> OrchestratorProtocol:
    """Dependency that injects the startup-compiled orchestrator graph."""
    orchestrator = getattr(request.app.state, "orchestrator", None)
    if orchestrator is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Orchestrator is not initialized",
        )
    return orchestrator


def get_session_store(request: Request) -> SessionStore:
    """Dependency for accessing Redis-backed session memory operations."""
    store = getattr(request.app.state, "session_store", None)
    if store is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Session store is not initialized",
        )
    return store


def _build_initial_state(payload: ChatRequest) -> dict[str, Any]:
    """Construct LegalAIState-compatible initial payload."""
    return {
        "session_id": payload.session_id,
        "question": payload.user_query,
        "user_query": payload.user_query,
        "incognito_mode": payload.incognito_mode,
        "intent": "",
        "citations": [],
        "final_response": "",
    }


def _extract_chat_response(final_state: dict[str, Any]) -> ChatResponse:
    """Extract normalized API response fields from final graph state."""
    intent = str(final_state.get("intent") or final_state.get("route") or "legal")

    final_response = final_state.get("final_response")
    if not final_response:
        final_response = final_state.get("answer") or final_state.get("draft_answer")
    if not final_response:
        raise ValueError("LegalOrchestrator completed without final_response")

    raw_citations = final_state.get("citations") or []
    citations = [item for item in raw_citations if isinstance(item, dict)]

    return ChatResponse(
        intent=intent,
        final_response=str(final_response),
        citations=citations,
    )


@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Run FairInsight LegalOrchestrator chat flow",
)
async def chat(
    payload: ChatRequest,
    orchestrator: OrchestratorProtocol = Depends(get_orchestrator),
    session_store: SessionStore = Depends(get_session_store),
) -> ChatResponse:
    """Execute the orchestrator graph and return structured chat output."""
    initial_state = _build_initial_state(payload)

    try:
        final_state = await orchestrator.graph.ainvoke(initial_state)
    except Exception as exc:
        logger.exception("Graph execution failed", exc_info=exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to execute legal orchestrator",
        ) from exc

    if not isinstance(final_state, dict):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Legal orchestrator returned invalid state",
        )

    try:
        response = _extract_chat_response(final_state)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    if payload.incognito_mode:
        try:
            await session_store.clear_session(payload.session_id)
        except Exception as exc:
            logger.warning("Failed to clear incognito session memory", exc_info=exc)

    return response
