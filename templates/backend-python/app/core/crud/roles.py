from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.models import Role, RolePermission


async def get_roles(
    db: AsyncSession,
    search: str = "",
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[dict], int]:
    query = select(Role).options(selectinload(Role.permissions))
    if search:
        search_filter = or_(
            Role.name.ilike(f"%{search}%"),
            Role.description.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    roles = list(result.scalars().unique().all())

    return [
        {
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "permissions": [rp.permission_code for rp in role.permissions],
            "isPreset": role.is_preset,
        }
        for role in roles
    ], total


async def get_role_by_id(db: AsyncSession, role_id: str) -> Role | None:
    result = await db.execute(select(Role).where(Role.id == role_id))
    return result.scalar_one_or_none()


async def create_role(
    db: AsyncSession,
    role_id: str,
    name: str,
    description: str,
    permissions: list[str],
) -> dict:
    role = Role(id=role_id, name=name, description=description, is_preset=False)
    db.add(role)

    for perm_code in permissions:
        rp = RolePermission(role_id=role_id, permission_code=perm_code)
        db.add(rp)

    await db.flush()
    return {
        "id": role.id,
        "name": role.name,
        "description": role.description,
        "permissions": permissions,
        "isPreset": False,
    }


async def update_role(
    db: AsyncSession,
    role: Role,
    name: str | None = None,
    description: str | None = None,
    permissions: list[str] | None = None,
) -> dict:
    if name is not None:
        role.name = name
    if description is not None:
        role.description = description

    if permissions is not None:
        result = await db.execute(select(RolePermission).where(RolePermission.role_id == role.id))
        for rp in result.scalars().all():
            await db.delete(rp)

        for perm_code in permissions:
            rp = RolePermission(role_id=role.id, permission_code=perm_code)
            db.add(rp)

    await db.flush()

    result = await db.execute(select(RolePermission).where(RolePermission.role_id == role.id))
    current_permissions = [rp.permission_code for rp in result.scalars().all()]

    return {
        "id": role.id,
        "name": role.name,
        "description": role.description,
        "permissions": current_permissions,
        "isPreset": role.is_preset,
    }


async def delete_role(db: AsyncSession, role: Role) -> None:
    await db.delete(role)
    await db.flush()
