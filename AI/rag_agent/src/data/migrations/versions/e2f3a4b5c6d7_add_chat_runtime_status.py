"""add chat runtime status

Revision ID: e2f3a4b5c6d7
Revises: d1f2a3b4c5d6
Create Date: 2026-08-02 21:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "e2f3a4b5c6d7"
down_revision: Union[str, None] = "d1f2a3b4c5d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "chat_sessions",
        sa.Column(
            "title",
            sa.String(length=200),
            server_default="Cuộc trò chuyện mới",
            nullable=False,
        ),
    )
    op.add_column(
        "chat_messages",
        sa.Column(
            "status", sa.String(length=20), server_default="completed", nullable=False
        ),
    )
    op.add_column(
        "chat_messages",
        sa.Column(
            "available_actions",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("chat_messages", "available_actions")
    op.drop_column("chat_messages", "status")
    op.drop_column("chat_sessions", "title")
