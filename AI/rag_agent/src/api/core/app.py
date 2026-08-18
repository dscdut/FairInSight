"""FastAPI app factory."""

from __future__ import annotations

import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.core.database import close_db
from src.api.v1.admin_documents import router as admin_documents_router
from src.api.v1.chat import router as chat_router
from src.api.v1.contracts import router as contracts_router
from src.api.v1.documents import router as documents_router
from src.api.v1.ingest import router as ingest_router
from src.api.v1.lookup import router as lookup_router
from src.config.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_db()


def _force_utf8_stdio() -> None:
    """Ép stdout/stderr sang UTF-8 để print() tiếng Việt không chết luồng.

    Windows mặc định stdout là cp1252 (đặc biệt khi chạy qua cmd.exe/WMI/docker),
    nên print() có ký tự như 'Đ'/'ứng' raise UnicodeEncodeError giữa node LangGraph
    → node crash → 500. errors='replace' để không bao giờ raise nữa. Trước đây từng
    phải né lẻ tẻ trong llm.py (_log); đây là chỗ sửa gốc cho toàn service.
    """
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure is not None:
            try:
                reconfigure(encoding="utf-8", errors="replace")
            except (ValueError, OSError):
                pass


def create_app() -> FastAPI:
    _force_utf8_stdio()
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.VERSION,
        debug=settings.DEBUG,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(chat_router)
    app.include_router(contracts_router)
    app.include_router(admin_documents_router)
    app.include_router(documents_router)
    app.include_router(ingest_router)
    app.include_router(lookup_router)

    @app.get("/health")
    async def health() -> dict:
        return {"status": "ok", "app": settings.APP_NAME, "version": settings.VERSION}

    return app
