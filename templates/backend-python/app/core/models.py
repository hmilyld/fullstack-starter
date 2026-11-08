"""集中导入所有 ORM 模型。

Alembic 的 ``env.py`` 依赖这个模块把全部表注册进 ``Base.metadata``；
应用运行时也需要它，避免迁移漏表。
"""

from app.ai_model.models import AiModel, AiModelPreset
from app.audit.models import AuditLog
from app.core.app_state import AppState
from app.menu.models import MenuGroup, MenuItem
from app.permission.models import Permission
from app.role.models import Role, RolePermission
from app.system.models import SystemConfig
from app.user.models import User

__all__ = [
    "AiModel",
    "AiModelPreset",
    "AppState",
    "AuditLog",
    "MenuGroup",
    "MenuItem",
    "Permission",
    "Role",
    "RolePermission",
    "SystemConfig",
    "User",
]
