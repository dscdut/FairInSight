"""Base + mixin dùng chung cho mọi ORM model."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base chung cho mọi ORM model."""


def new_uuid() -> str:
    """Sinh UUID dạng string (PK kiểu String(36))."""
    return str(uuid.uuid4())


class TimestampMixin:
    """Mixin thêm created_at / updated_at do DB tự điền."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
