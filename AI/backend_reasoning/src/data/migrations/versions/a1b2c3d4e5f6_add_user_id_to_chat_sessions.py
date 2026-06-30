"""add user_id to chat_sessions

Revision ID: a1b2c3d4e5f6
Revises: ce11ac153b9f
Create Date: 2026-06-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'ce11ac153b9f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Gắn phiên chat với người dùng (UUID dạng text). Nullable: phiên ẩn danh/test
    # vẫn chạy. Viết tay (không autogenerate) để KHÔNG đụng tsv/HNSW do raw SQL quản lý.
    op.add_column('chat_sessions', sa.Column('user_id', sa.String(length=36), nullable=True))
    op.create_index('ix_chat_sessions_user_id', 'chat_sessions', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_chat_sessions_user_id', table_name='chat_sessions')
    op.drop_column('chat_sessions', 'user_id')
