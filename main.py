"""FairInsight backend entry point (pure REST API, no static rendering)."""

from __future__ import annotations

from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI
from fastapi.responses import ORJSONResponse
from redis.asyncio import Redis

from app.api.routes.chat import router as chat_router
from app.agents import LegalOrchestrator
from app.core import get_settings
from app.core.session_store import SessionStore
from app.llm.fairinsight_llm import FairInsightLLM
from app.rag import FairInsightEmbedder, HybridSearcher


def _ssl_enabled(ssl_mode: str) -> bool:
    return ssl_mode.lower() in {"require", "verify-ca", "verify-full"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize all shared runtime dependencies at startup."""
    settings = get_settings()

    db_pool = await asyncpg.create_pool(
        host=settings.db.host,
        port=settings.db.port,
        user=settings.db.user,
        password=settings.db.password,
        database=settings.db.name,
        min_size=settings.db.pool_min_size,
        max_size=settings.db.pool_max_size,
        command_timeout=settings.db.command_timeout_seconds,
        ssl=_ssl_enabled(settings.db.ssl_mode),
    )

    redis_client = Redis.from_url(
        settings.redis.url,
        decode_responses=True,
        socket_timeout=settings.redis.socket_timeout_seconds,
        max_connections=settings.redis.max_connections,
    )

    embedder = FairInsightEmbedder(settings)
    llm = FairInsightLLM(settings)
    searcher = HybridSearcher(pool=db_pool, settings=settings)
    orchestrator = LegalOrchestrator(embedder=embedder, llm=llm, searcher=searcher)
    session_store = SessionStore(
        redis_client,
        key_prefix=settings.redis.key_prefix,
    )

    app.state.settings = settings
    app.state.db_pool = db_pool
    app.state.redis = redis_client
    app.state.embedder = embedder
    app.state.llm = llm
    app.state.searcher = searcher
    app.state.orchestrator = orchestrator
    app.state.session_store = session_store

    try:
        yield
    finally:
        await redis_client.aclose()
        await db_pool.close()


app = FastAPI(
    title="FairInsight API",
    version="4.0.0",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)

app.include_router(chat_router)


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    """Simple health probe endpoint for load balancers and uptime checks."""
    return {"status": "ok"}
