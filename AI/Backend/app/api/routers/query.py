import time
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import models
from app.db.session import get_db
from app.services import auth_service
from app.services.query_service import run_query

router = APIRouter(tags=["query"])


class QueryRequest(BaseModel):
    question: str = Field(min_length=3)
    top_k: int = Field(default=5, ge=1, le=20)
    legal_domain: str | None = None
    is_active_only: bool = True
    doc_summary: str | None = None
    history: list[dict[str, str]] = Field(default_factory=list)
    chat_id: str | None = Field(default=None, alias="chatId")

    class Config:
        populate_by_name = True


class Citation(BaseModel):
    article_ref: str | None = None
    doc_title: str | None = None
    content: str | None = None
    score: float = 0.0


class QueryResponse(BaseModel):
    answer: str
    citations: list[Citation]
    legal_domain: str | None = None
    latency_ms: int


@router.post("/query", response_model=QueryResponse)
async def query(
    payload: QueryRequest,
    current_user: models.User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
) -> QueryResponse:
    t0 = time.perf_counter()

    # 1. Verify and save User query in relational database (if chat_id provided)
    chat = None
    if payload.chat_id:
        chat = db.query(models.Chat).filter(
            models.Chat.id == payload.chat_id,
            models.Chat.user_id == current_user.id
        ).first()
        if chat:
            # Check if this user message already exists to avoid duplication
            user_msg_id = f"m-u-{int(time.time() * 1000)}"
            user_msg = models.Message(
                id=user_msg_id,
                chat_id=payload.chat_id,
                role="user",
                content=payload.question,
                created_at=datetime.utcnow()
            )
            db.add(user_msg)
            chat.updated_at = datetime.utcnow()
            db.commit()

    # 2. Execute RAG query (Retrieve & Generate)
    result = await run_query(
        question=payload.question,
        top_k=payload.top_k,
        legal_domain=payload.legal_domain,
        is_active_only=payload.is_active_only,
        doc_summary=payload.doc_summary,
        history=payload.history,
    )

    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])

    latency_ms = int((time.perf_counter() - t0) * 1000)
    citations_data = result.get("citations", [])

    # 3. Save Assistant reply in database (if chat_id provided)
    if chat:
        assistant_msg_id = f"m-a-{int(time.time() * 1000)}"
        assistant_msg = models.Message(
            id=assistant_msg_id,
            chat_id=payload.chat_id,
            role="assistant",
            content=result.get("answer", ""),
            citations=json.dumps(citations_data),
            created_at=datetime.utcnow()
        )
        db.add(assistant_msg)
        chat.updated_at = datetime.utcnow()
        db.commit()

    return QueryResponse(
        answer=result.get("answer", ""),
        citations=[Citation(**c) for c in citations_data],
        legal_domain=payload.legal_domain,
        latency_ms=latency_ms,
    )
