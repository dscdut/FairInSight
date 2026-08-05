"""add target_clause/target_point to relations

Hạ granularity quan hệ: amendment/reference nối XUỐNG đúng Khoản/Điểm (không chỉ Điều).
"Sửa khoản 3 Điều 102" → target_article=102, target_clause=3 → resolve tới Khoản 3.

Revision ID: d1f2a3b4c5d6
Revises: a1b2c3d4e5f6
Create Date: 2026-06-28 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'd1f2a3b4c5d6'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('amendments', sa.Column('target_clause', sa.String(length=20), nullable=True))
    op.add_column('amendments', sa.Column('target_point', sa.String(length=20), nullable=True))
    op.add_column('references', sa.Column('target_clause', sa.String(length=20), nullable=True))
    op.add_column('references', sa.Column('target_point', sa.String(length=20), nullable=True))


def downgrade() -> None:
    op.drop_column('references', 'target_point')
    op.drop_column('references', 'target_clause')
    op.drop_column('amendments', 'target_point')
    op.drop_column('amendments', 'target_clause')
