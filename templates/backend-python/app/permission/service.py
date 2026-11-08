"""权限领域的业务逻辑。

菜单权限（``type == "menu"``）的增删改一律拒绝：它们由菜单管理维护，
以保证 ``menu_items`` 与 ``permissions`` 不会脱节。
"""

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, InvalidOperationError, NotFoundError
from app.core.permissions_catalog import ALL_PERMISSIONS
from app.permission.models import Permission
from app.permission.schemas import PermissionCreate, PermissionOut, PermissionUpdate
from app.role.models import Role, RolePermission

MENU_TYPE = "menu"
OPERATION_TYPE = "operation"


def _to_out(permission: Permission) -> dict:
    return PermissionOut(
        code=permission.code,
        name=permission.name,
        type=permission.type,
        parent=permission.parent,
    ).model_dump()


async def list_permissions(
    db: AsyncSession, type: str | None = None, parent: str | None = None
) -> list[dict]:
    query = select(Permission)
    if type:
        query = query.where(Permission.type == type)
    if parent:
        query = query.where(Permission.parent == parent)
    permissions = (await db.execute(query.order_by(Permission.code))).scalars().all()
    return [_to_out(permission) for permission in permissions]


async def get_permission(db: AsyncSession, code: str) -> Permission:
    permission = (
        await db.execute(select(Permission).where(Permission.code == code))
    ).scalar_one_or_none()
    if permission is None:
        raise NotFoundError("权限不存在")
    return permission


async def _assert_parent_is_menu(db: AsyncSession, parent: str) -> None:
    record = (
        await db.execute(select(Permission).where(Permission.code == parent))
    ).scalar_one_or_none()
    if record is None or record.type != MENU_TYPE:
        raise InvalidOperationError("所属菜单不存在")


async def create_permission(db: AsyncSession, data: PermissionCreate) -> dict:
    if data.type == MENU_TYPE:
        raise InvalidOperationError("请通过菜单管理创建菜单")
    existing = (
        await db.execute(select(Permission).where(Permission.code == data.code))
    ).scalar_one_or_none()
    if existing is not None:
        raise ConflictError("权限编码已存在")
    if data.parent:
        await _assert_parent_is_menu(db, data.parent)

    permission = Permission(
        code=data.code, name=data.name, type=data.type, parent=data.parent
    )
    db.add(permission)
    await db.flush()
    return _to_out(permission)


async def update_permission(db: AsyncSession, code: str, data: PermissionUpdate) -> dict:
    permission = await get_permission(db, code)
    if permission.type == MENU_TYPE:
        raise InvalidOperationError("请通过菜单管理编辑菜单")
    if data.parent:
        await _assert_parent_is_menu(db, data.parent)
    if data.name is not None:
        permission.name = data.name
    if data.parent is not None:
        permission.parent = data.parent
    await db.flush()
    return _to_out(permission)


async def delete_permission(db: AsyncSession, code: str) -> None:
    permission = await get_permission(db, code)
    if permission.type == MENU_TYPE:
        raise InvalidOperationError("请通过菜单管理删除菜单")

    await db.execute(
        delete(RolePermission).where(RolePermission.permission_code == permission.code)
    )
    await db.delete(permission)
    await db.flush()


async def sync_catalog(db: AsyncSession) -> dict:
    """把权限目录同步进数据库，并补齐 admin 角色缺失的授权。"""
    existing = {
        permission.code: permission
        for permission in (await db.execute(select(Permission))).scalars().all()
    }

    added: list[str] = []
    updated: list[str] = []
    for item in ALL_PERMISSIONS:
        permission = existing.get(item["code"])
        if permission is None:
            db.add(Permission(**item))
            added.append(item["code"])
            continue
        if permission.name != item["name"] or permission.parent != item.get("parent"):
            permission.name = item["name"]
            permission.parent = item.get("parent")
            updated.append(item["code"])

    granted: list[str] = []
    admin = (await db.execute(select(Role).where(Role.id == "admin"))).scalar_one_or_none()
    if admin is not None:
        granted_codes = set(
            (
                await db.execute(
                    select(RolePermission.permission_code).where(
                        RolePermission.role_id == "admin"
                    )
                )
            )
            .scalars()
            .all()
        )
        for item in ALL_PERMISSIONS:
            if item["code"] not in granted_codes:
                db.add(RolePermission(role_id="admin", permission_code=item["code"]))
                granted.append(item["code"])

    await db.flush()
    return {"added": added, "updated": updated, "granted": granted}
