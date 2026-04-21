"""add accuracy, suggestions, difficulty to questions

Revision ID: a1b2c3d4e5f6
Revises: 3fd24170ecea
Create Date: 2026-04-21 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '3fd24170ecea'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column('questions', sa.Column('accuracy', sa.Float(), nullable=True), schema='dsa')
    op.add_column('questions', sa.Column('suggestions', sa.String(), nullable=True), schema='dsa')
    op.add_column('questions', sa.Column('difficulty', sa.String(), nullable=True, server_default='Medium'), schema='dsa')


def downgrade():
    op.drop_column('questions', 'difficulty', schema='dsa')
    op.drop_column('questions', 'suggestions', schema='dsa')
    op.drop_column('questions', 'accuracy', schema='dsa')
