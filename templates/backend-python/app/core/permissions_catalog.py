"""权限目录 —— 系统权限的唯一数据源。

新增功能权限时，只需在此文件中添加对应条目：
- 启动时的 sync_permissions 会自动将其写入已有数据库；
- 菜单接口也会自动拾取新的菜单权限。

不要在 seed.py 或其他位置重复维护权限列表。
"""

MENU_PERMISSIONS = [
    {"code": "dashboard", "name": "仪表盘", "type": "menu"},
    {"code": "users", "name": "用户管理", "type": "menu"},
    {"code": "roles", "name": "角色管理", "type": "menu"},
    {"code": "permissions", "name": "权限管理", "type": "menu"},
    {"code": "settings", "name": "系统设置", "type": "menu"},
    {"code": "ai_models", "name": "AI模型配置", "type": "menu"},
    {"code": "audit_logs", "name": "审计日志", "type": "menu"},
]

OPERATION_PERMISSIONS = [
    {"code": "users.create", "name": "新增用户", "type": "operation", "parent": "users"},
    {"code": "users.edit", "name": "编辑用户", "type": "operation", "parent": "users"},
    {"code": "users.delete", "name": "删除用户", "type": "operation", "parent": "users"},
    {"code": "users.assign_role", "name": "角色维护", "type": "operation", "parent": "users"},
    {"code": "roles.create", "name": "新增角色", "type": "operation", "parent": "roles"},
    {"code": "roles.edit", "name": "编辑角色", "type": "operation", "parent": "roles"},
    {"code": "roles.delete", "name": "删除角色", "type": "operation", "parent": "roles"},
    {"code": "permissions.create", "name": "新增权限", "type": "operation", "parent": "permissions"},
    {"code": "permissions.edit", "name": "编辑权限", "type": "operation", "parent": "permissions"},
    {"code": "permissions.delete", "name": "删除权限", "type": "operation", "parent": "permissions"},
    {"code": "settings.edit", "name": "编辑系统设置", "type": "operation", "parent": "settings"},
    {"code": "ai_models.create", "name": "新增AI模型", "type": "operation", "parent": "ai_models"},
    {"code": "ai_models.edit", "name": "编辑AI模型", "type": "operation", "parent": "ai_models"},
    {"code": "ai_models.delete", "name": "删除AI模型", "type": "operation", "parent": "ai_models"},
    {"code": "ai_models.presets.create", "name": "新增预设模型", "type": "operation", "parent": "ai_models"},
    {"code": "ai_models.presets.edit", "name": "编辑预设模型", "type": "operation", "parent": "ai_models"},
    {"code": "ai_models.presets.delete", "name": "删除预设模型", "type": "operation", "parent": "ai_models"},
]

ALL_PERMISSIONS = MENU_PERMISSIONS + OPERATION_PERMISSIONS
