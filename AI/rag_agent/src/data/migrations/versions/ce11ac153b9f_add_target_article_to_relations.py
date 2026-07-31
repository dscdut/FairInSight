"""add target_article to relations

Revision ID: ce11ac153b9f
Revises: 80626c44bffb
Create Date: 2026-06-16 07:29:52.151958

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'ce11ac153b9f'
down_revision: Union[str, None] = '80626c44bffb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Chỉ thêm cột target_article. KHÔNG đụng tsv/HNSW (do raw SQL quản lý, ORM
    # không thấy nên autogenerate đòi xóa nhầm — đã bỏ các lệnh drop đó).
    op.add_column('amendments', sa.Column('target_article', sa.String(length=20), nullable=True))
    op.add_column('references', sa.Column('target_article', sa.String(length=20), nullable=True))


def downgrade() -> None:
    op.drop_column('references', 'target_article')
    op.drop_column('amendments', 'target_article')
