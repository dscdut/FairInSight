"""Sync engine/session cho pipeline ingest (chạy ngoài event loop, dễ debug).

Chat online dùng async (api/core/database.py); ingest CLI dùng sync ở đây.
"""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from src.config.settings import settings

sync_engine = create_engine(settings.DATABASE_URL_SYNC, pool_pre_ping=True, future=True)
SyncSessionLocal = sessionmaker(bind=sync_engine, expire_on_commit=False, class_=Session)
