from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.models import Permission


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


async def delete_permission(db: AsyncSession, permission: Permission) -> None:
    if permission.type == "menu":
        result = await db.execute(select(Permission).where(Permission.parent == permission.code))
        for child in result.scalars().all():
            await db.delete(child)

    await db.delete(permission)
    await db.flush()
