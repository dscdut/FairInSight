"""FastAPI app factory."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.core.database import close_db
from src.api.v1.admin_documents import router as admin_documents_router
from src.api.v1.chat import router as chat_router
from src.api.v1.documents import router as documents_router
from src.api.v1.ingest import router as ingest_router
from src.api.v1.lookup import router as lookup_router
from src.config.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_db()


def create_app() -> FastAPI:
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
    app.include_router(admin_documents_router)
    app.include_router(documents_router)
    app.include_router(ingest_router)
    app.include_router(lookup_router)

    @app.get("/health")
    async def health() -> dict:
        return {"status": "ok", "app": settings.APP_NAME, "version": settings.VERSION}

    return app
