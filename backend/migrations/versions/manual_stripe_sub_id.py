"""add stripe_subscription_id field manually

Revision ID: manual_stripe_sub_id
Revises: 653a2e9135e5
Create Date: 2025-08-20 15:37:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "manual_stripe_sub_id"  # ← 32文字以内
down_revision: Union[str, Sequence[str], None] = "653a2e9135e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "subscriptions", sa.Column("stripe_subscription_id", sa.String(), nullable=True)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("subscriptions", "stripe_subscription_id")
