"""给 system_config 增加站点默认语言。

用户手动切换语言后以用户选择为准；该字段只决定未选择用户的初始语言。

Revision ID: 0003
Revises: 0002
Create Date: 2026-11-16
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("system_config", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("default_locale", sa.String(length=20), server_default="zh-CN", nullable=False)
        )


def downgrade() -> None:
    with op.batch_alter_table("system_config", schema=None) as batch_op:
        batch_op.drop_column("default_locale")
