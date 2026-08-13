from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.models import Permission, Role, RolePermission
from app.core.permissions_catalog import ALL_PERMISSIONS


async def get_permissions(
    db: AsyncSession,
    type: str | None = None,
    parent: str | None = None,
) -> list[dict]:
    query = select(Permission)
    if type:
        query = query.where(Permission.type == type)
    if parent:
        query = query.where(Permission.parent == parent)

    result = await db.execute(query)
    permissions = result.scalars().all()

    return [
        {
            "code": p.code,
            "name": p.name,
            "type": p.type,
            "parent": p.parent,
        }
        for p in permissions
    ]


async def get_permission_by_code(db: AsyncSession, code: str) -> Permission | None:
    result = await db.execute(select(Permission).where(Permission.code == code))
    return result.scalar_one_or_none()


async def create_permission(
    db: AsyncSession,
    code: str,
    name: str,
    type: str,
    parent: str | None = None,
) -> dict:
    permission = Permission(code=code, name=name, type=type, parent=parent)
    db.add(permission)
    await db.flush()
    return {"code": code, "name": name, "type": type, "parent": parent}


async def update_permission(
    db: AsyncSession,
    permission: Permission,
    name: str | None = None,
    parent: str | None = None,
) -> dict:
    if name is not None:
        permission.name = name
    if parent is not None:
        permission.parent = parent
    await db.flush()
    return {
        "code": permission.code,
        "name": permission.name,
        "type": permission.type,
        "parent": permission.parent,
    }


async def sync_permissions(db: AsyncSession) -> dict:
    existing = (await db.execute(select(Permission))).scalars().all()
    existing_by_code = {p.code: p for p in existing}

    added: list[str] = []
    updated: list[str] = []
    for item in ALL_PERMISSIONS:
        permission = existing_by_code.get(item["code"])
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
        role_codes = (
            await db.execute(
                select(RolePermission.permission_code).where(RolePermission.role_id == "admin")
            )
        ).scalars().all()
        for item in ALL_PERMISSIONS:
            if item["code"] not in role_codes:
                db.add(RolePermission(role_id="admin", permission_code=item["code"]))
                granted.append(item["code"])

    await db.flush()
    return {"added": added, "updated": updated, "granted": granted}


async def delete_permission(db: AsyncSession, permission: Permission) -> None:
    codes_to_delete = [permission.code]
    if permission.type == "menu":
        result = await db.execute(select(Permission).where(Permission.parent == permission.code))
        children = result.scalars().all()
        codes_to_delete.extend(child.code for child in children)
        for child in children:
            await db.delete(child)

    await db.execute(delete(RolePermission).where(RolePermission.permission_code.in_(codes_to_delete)))

    await db.delete(permission)
    await db.flush()
