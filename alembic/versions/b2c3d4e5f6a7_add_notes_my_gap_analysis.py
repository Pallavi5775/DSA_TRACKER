"""add notes and my_gap_analysis to questions

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-21 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column('questions', sa.Column('notes', sa.String(), nullable=True), schema='dsa')
    op.add_column('questions', sa.Column('my_gap_analysis', sa.String(), nullable=True), schema='dsa')


def downgrade():
    op.drop_column('questions', 'my_gap_analysis', schema='dsa')
    op.drop_column('questions', 'notes', schema='dsa')
