"""harden chat session title

Revision ID: f3a4b5c6d7e8
Revises: e2f3a4b5c6d7
Create Date: 2026-08-02 23:55:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f3a4b5c6d7e8"
down_revision: Union[str, None] = "e2f3a4b5c6d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "UPDATE chat_sessions SET title = 'Cuộc trò chuyện mới' "
        "WHERE title IS NULL OR btrim(title) = ''"
    )
    op.alter_column(
        "chat_sessions",
        "title",
        existing_type=sa.String(length=200),
        server_default="Cuộc trò chuyện mới",
        nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "chat_sessions",
        "title",
        existing_type=sa.String(length=200),
        server_default=None,
        nullable=True,
    )
