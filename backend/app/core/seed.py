from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.models import Permission, Role, RolePermission, User
from app.core.security import hash_password


async def seed_data(db: AsyncSession) -> None:
    result = await db.execute(select(User).limit(1))
    if result.scalar_one_or_none() is not None:
        return

    # 检查权限是否已存在，避免重复插入
    perm_result = await db.execute(select(Permission).limit(1))
    if perm_result.scalar_one_or_none() is not None:
        return

    menu_permissions = [
        {"code": "dashboard", "name": "仪表盘", "type": "menu"},
        {"code": "users", "name": "用户管理", "type": "menu"},
        {"code": "roles", "name": "角色管理", "type": "menu"},
        {"code": "permissions", "name": "权限管理", "type": "menu"},
        {"code": "settings", "name": "系统设置", "type": "menu"},
        {"code": "ai_models", "name": "AI模型配置", "type": "menu"},
    ]

    operation_permissions = [
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

    for perm in menu_permissions + operation_permissions:
        db.add(Permission(**perm))

    all_permission_codes = [p["code"] for p in menu_permissions + operation_permissions]

    roles = [
        {
            "id": "admin",
            "name": "管理员",
            "description": "拥有系统所有权限",
            "is_preset": True,
            "permissions": all_permission_codes,
        },
        {
            "id": "user",
            "name": "普通用户",
            "description": "拥有基本的查看权限",
            "is_preset": True,
            "permissions": ["dashboard", "users", "settings"],
        },
        {
            "id": "pending_review",
            "name": "待审核",
            "description": "注册后等待管理员审核",
            "is_preset": True,
            "permissions": [],
        },
    ]

    for role_data in roles:
        permissions = role_data.pop("permissions")
        role = Role(**role_data)
        db.add(role)
        for perm_code in permissions:
            db.add(RolePermission(role_id=role.id, permission_code=perm_code))

    users = [
        {"username": "admin", "name": "管理员", "email": "admin@example.com", "role_id": "admin"},
        {"username": "zhangsan", "name": "张三", "email": "zhangsan@example.com", "role_id": "admin"},
        {"username": "lisi", "name": "李四", "email": "lisi@example.com", "role_id": "user"},
        {"username": "wangwu", "name": "王五", "email": "wangwu@example.com", "role_id": "user"},
        {"username": "zhaoliu", "name": "赵六", "email": "zhaoliu@example.com", "role_id": "user"},
    ]

    for user_data in users:
        user = User(
            **user_data,
            password_hash=hash_password("123456"),
        )
        db.add(user)

    await db.flush()
