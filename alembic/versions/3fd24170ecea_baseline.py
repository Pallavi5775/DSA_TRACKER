"""baseline

Revision ID: 3fd24170ecea
Revises: 
Create Date: 2026-04-21 09:10:03.656703

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3fd24170ecea'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # ✅ Create schema first
    op.execute("CREATE SCHEMA IF NOT EXISTS dsa")

    # ✅ Create questions table
    op.create_table(
        "questions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("pattern", sa.String(), nullable=True),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("coverage_status", sa.String(), nullable=True),
        sa.Column("revision_status", sa.String(), nullable=True),
        sa.Column("ease_factor", sa.Float(), default=2.5),
        sa.Column("interval_days", sa.Integer(), default=0),
        sa.Column("next_revision", sa.String(), nullable=True),
        schema="dsa"
    )

    # ✅ Create practice_logs table
    op.create_table(
        "practice_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("question_id", sa.Integer(), nullable=False),
        sa.Column("date", sa.String(), nullable=True),
        sa.Column("logic", sa.String(), nullable=True),
        sa.Column("code", sa.String(), nullable=True),
        sa.Column("time_taken", sa.Integer(), nullable=True),
        sa.Column("correct", sa.Boolean(), default=True),

        # ✅ Foreign key WITH schema
        sa.ForeignKeyConstraint(
            ["question_id"],
            ["dsa.questions.id"],
            ondelete="CASCADE"
        ),
        schema="dsa"
    )

    # ✅ Optional: index for performance
    op.create_index(
        "ix_dsa_practice_logs_question_id",
        "practice_logs",
        ["question_id"],
        schema="dsa"
    )


def downgrade():
    # Drop in reverse order
    op.drop_index(
        "ix_dsa_practice_logs_question_id",
        table_name="practice_logs",
        schema="dsa"
    )

    op.drop_table("practice_logs", schema="dsa")
    op.drop_table("questions", schema="dsa")