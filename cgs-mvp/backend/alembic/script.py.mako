"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = ${repr(up_revision)}
down_revision: Union[str, None] = ${repr(down_revision)}
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


def upgrade() -> None:
    """Apply migration.

    Write SQL using op.execute(), for example:
        op.execute("ALTER TABLE briefs ADD COLUMN settings JSONB DEFAULT '{}'")
        op.execute("CREATE INDEX idx_briefs_settings ON briefs USING GIN (settings)")
    """
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    """Revert migration.

    Write the reverse SQL, for example:
        op.execute("DROP INDEX IF EXISTS idx_briefs_settings")
        op.execute("ALTER TABLE briefs DROP COLUMN IF EXISTS settings")
    """
    ${downgrades if downgrades else "pass"}
