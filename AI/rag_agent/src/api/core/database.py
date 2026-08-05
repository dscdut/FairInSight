"""Async engine + session factory (SQLAlchemy 2.0)."""

from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.config.settings import settings

# Supabase pooler (pgbouncer) KHÔNG hỗ trợ prepared statement của asyncpg →
# tắt statement cache để connect được cả pooler lẫn Postgres thường.
_connect_args = {"statement_cache_size": 0} if "pooler.supabase.com" in settings.DATABASE_URL else {}
engine = create_async_engine(
    settings.DATABASE_URL, echo=settings.DB_ECHO, pool_pre_ping=True,
    connect_args=_connect_args,
)
AsyncSessionLocal = async_sessionmaker(
    bind=engine, expire_on_commit=False, class_=AsyncSession
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yield 1 session per request."""
    async with AsyncSessionLocal() as session:
        yield session


async def close_db() -> None:
    await engine.dispose()
