"""add users table and user_id to questions

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-04-21 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('username', sa.String(), unique=True, nullable=False),
        sa.Column('email', sa.String(), unique=True, nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        schema='dsa',
    )
    op.create_index('ix_dsa_users_username', 'users', ['username'], schema='dsa')
    op.create_index('ix_dsa_users_email',    'users', ['email'],    schema='dsa')

    op.add_column('questions',
        sa.Column('user_id', sa.Integer(), nullable=True),
        schema='dsa',
    )
    op.create_foreign_key(
        'fk_questions_user_id',
        'questions', 'users',
        ['user_id'], ['id'],
        source_schema='dsa', referent_schema='dsa',
        ondelete='CASCADE',
    )


def downgrade():
    op.drop_constraint('fk_questions_user_id', 'questions', schema='dsa', type_='foreignkey')
    op.drop_column('questions', 'user_id', schema='dsa')
    op.drop_index('ix_dsa_users_email',    table_name='users', schema='dsa')
    op.drop_index('ix_dsa_users_username', table_name='users', schema='dsa')
    op.drop_table('users', schema='dsa')
