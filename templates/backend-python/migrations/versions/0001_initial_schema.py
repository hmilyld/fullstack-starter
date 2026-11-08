"""初始结构。

与 Java 侧 ``V1__init.sql`` + ``V2__menu_and_app_state.sql`` + ``V3__menu_hidden.sql``
等价：两栈必须能互相识别同一个数据库结构。

Revision ID: 0001
Revises:
Create Date: 2026-11-08
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "permissions",
        sa.Column("code", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("parent", sa.String(length=100), nullable=True),
        sa.PrimaryKeyConstraint("code"),
    )

    op.create_table(
        "roles",
        sa.Column("id", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), server_default="", nullable=False),
        sa.Column("is_preset", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "role_permissions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("role_id", sa.String(length=50), nullable=False),
        sa.Column("permission_code", sa.String(length=100), nullable=False),
        sa.ForeignKeyConstraint(["permission_code"], ["permissions.code"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=100), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role_id", sa.String(length=50), nullable=False),
        sa.Column("avatar", sa.String(length=255), server_default="", nullable=False),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "system_config",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("site_name", sa.String(length=100), server_default="管理系统", nullable=False),
        sa.Column("site_description", sa.Text(), server_default="", nullable=False),
        sa.Column("keywords", sa.String(length=255), server_default="", nullable=False),
        sa.Column(
            "maintenance_enabled", sa.Boolean(), server_default=sa.text("0"), nullable=False
        ),
        sa.Column("maintenance_message", sa.Text(), server_default="", nullable=False),
        sa.Column(
            "open_registration", sa.Boolean(), server_default=sa.text("1"), nullable=False
        ),
        sa.Column("manual_review", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.Column("default_role_id", sa.String(length=50), server_default="user", nullable=False),
        sa.Column("welcome_message", sa.Text(), server_default="", nullable=False),
        sa.Column("smtp_enabled", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.Column("smtp_host", sa.String(length=255), server_default="", nullable=False),
        sa.Column("smtp_port", sa.Integer(), server_default=sa.text("587"), nullable=False),
        sa.Column("smtp_username", sa.String(length=255), server_default="", nullable=False),
        sa.Column("smtp_password", sa.String(length=255), server_default="", nullable=False),
        sa.Column("smtp_from_name", sa.String(length=100), server_default="管理系统", nullable=False),
        sa.Column("smtp_from_email", sa.String(length=100), server_default="", nullable=False),
        sa.Column("smtp_use_ssl", sa.Boolean(), server_default=sa.text("1"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "ai_models",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("alias", sa.String(length=100), nullable=False),
        sa.Column("model_name", sa.String(length=100), nullable=False),
        sa.Column("api_url", sa.String(length=255), nullable=False),
        sa.Column("api_key", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), server_default="", nullable=False),
        sa.Column("is_default", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ai_models_alias", "ai_models", ["alias"], unique=True)

    op.create_table(
        "ai_model_presets",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("group", sa.String(length=100), nullable=False),
        sa.Column("alias", sa.String(length=100), nullable=False),
        sa.Column("model_name", sa.String(length=100), nullable=False),
        sa.Column("api_url", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), server_default="", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("1"), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ai_model_presets_group", "ai_model_presets", ["group"], unique=False)
    op.create_index("ix_ai_model_presets_alias", "ai_model_presets", ["alias"], unique=False)

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("username", sa.String(length=50), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("ip", sa.String(length=50), server_default="", nullable=False),
        sa.Column("status", sa.String(length=20), server_default="success", nullable=False),
        sa.Column("detail", sa.Text(), server_default="", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"], unique=False)
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"], unique=False)
    op.create_index("ix_audit_logs_status", "audit_logs", ["status"], unique=False)
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"], unique=False)

    op.create_table(
        "app_state",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_epoch", sa.String(length=64), nullable=False),
        sa.Column(
            "menu_layout_version", sa.Integer(), server_default=sa.text("1"), nullable=False
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "menu_groups",
        sa.Column("id", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("is_system", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "menu_items",
        sa.Column("permission_code", sa.String(length=100), nullable=False),
        sa.Column("group_id", sa.String(length=50), nullable=False),
        sa.Column("route", sa.String(length=255), nullable=False),
        sa.Column("icon", sa.String(length=50), server_default="circle", nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("is_system", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.Column("hidden", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.PrimaryKeyConstraint("permission_code"),
    )
    op.create_index("ix_menu_items_group_id", "menu_items", ["group_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_menu_items_group_id", table_name="menu_items")
    op.drop_table("menu_items")
    op.drop_table("menu_groups")
    op.drop_table("app_state")
    op.drop_index("ix_audit_logs_created_at", table_name="audit_logs")
    op.drop_index("ix_audit_logs_status", table_name="audit_logs")
    op.drop_index("ix_audit_logs_action", table_name="audit_logs")
    op.drop_index("ix_audit_logs_user_id", table_name="audit_logs")
    op.drop_table("audit_logs")
    op.drop_index("ix_ai_model_presets_alias", table_name="ai_model_presets")
    op.drop_index("ix_ai_model_presets_group", table_name="ai_model_presets")
    op.drop_table("ai_model_presets")
    op.drop_index("ix_ai_models_alias", table_name="ai_models")
    op.drop_table("ai_models")
    op.drop_table("system_config")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_table("users")
    op.drop_table("role_permissions")
    op.drop_table("roles")
    op.drop_table("permissions")
