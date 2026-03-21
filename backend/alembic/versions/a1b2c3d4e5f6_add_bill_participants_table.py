"""Add bill_participants table

Revision ID: a1b2c3d4e5f6
Revises: 1cb221070a67
Create Date: 2026-03-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'ca08bcaadc58'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'bill_participants' not in inspector.get_table_names():
        op.create_table(
            'bill_participants',
            sa.Column('bill_id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(['bill_id'], ['bills.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('bill_id', 'user_id'),
        )


def downgrade() -> None:
    op.drop_table('bill_participants')
