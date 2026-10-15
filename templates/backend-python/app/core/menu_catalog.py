"""Built-in menu presentation catalog.

Permissions remain the authorization source of truth. This catalog only seeds
the initial menu groups and items. Existing group and order changes are kept.
"""

MENU_GROUPS = [
    {"id": "navigation", "name": "导航", "sort_order": 1, "is_system": True},
    {"id": "management", "name": "管理", "sort_order": 2, "is_system": True},
]

MENU_ITEMS = [
    {
        "permission_code": "dashboard",
        "group_id": "navigation",
        "route": "/dashboard",
        "icon": "layout-dashboard",
        "sort_order": 1,
        "is_system": True,
    },
    {
        "permission_code": "users",
        "group_id": "management",
        "route": "/settings/user",
        "icon": "users",
        "sort_order": 1,
        "is_system": True,
    },
    {
        "permission_code": "roles",
        "group_id": "management",
        "route": "/settings/role",
        "icon": "shield-check",
        "sort_order": 2,
        "is_system": True,
    },
    {
        "permission_code": "permissions",
        "group_id": "management",
        "route": "/settings/permission",
        "icon": "key-round",
        "sort_order": 3,
        "is_system": True,
    },
    {
        "permission_code": "menus",
        "group_id": "management",
        "route": "/settings/menu",
        "icon": "panel-left",
        "sort_order": 4,
        "is_system": True,
    },
    {
        "permission_code": "settings",
        "group_id": "management",
        "route": "/settings/system",
        "icon": "settings",
        "sort_order": 5,
        "is_system": True,
    },
    {
        "permission_code": "ai_models",
        "group_id": "management",
        "route": "/settings/ai-model",
        "icon": "bot",
        "sort_order": 6,
        "is_system": True,
    },
    {
        "permission_code": "audit_logs",
        "group_id": "management",
        "route": "/settings/audit-log",
        "icon": "file-text",
        "sort_order": 7,
        "is_system": True,
    },
    {
        "permission_code": "data_management",
        "group_id": "management",
        "route": "/settings/data",
        "icon": "database",
        "sort_order": 8,
        "is_system": True,
    },
]
