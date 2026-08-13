from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.models import Permission, Role, RolePermission, User
from app.core.permissions_catalog import MENU_PERMISSIONS, OPERATION_PERMISSIONS
from app.core.security import hash_password


async def seed_data(db: AsyncSession) -> None:
    result = await db.execute(select(User).limit(1))
    if result.scalar_one_or_none() is not None:
        return

    # 检查权限是否已存在，避免重复插入
    perm_result = await db.execute(select(Permission).limit(1))
    if perm_result.scalar_one_or_none() is not None:
        return

    # 权限列表来自 app.core.permissions_catalog 统一目录
    for perm in MENU_PERMISSIONS + OPERATION_PERMISSIONS:
        db.add(Permission(**perm))

    all_permission_codes = [p["code"] for p in MENU_PERMISSIONS + OPERATION_PERMISSIONS]

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
