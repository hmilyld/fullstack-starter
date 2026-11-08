"""角色领域的业务逻辑。"""

import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import InvalidOperationError, NotFoundError
from app.core.pagination import Pagination
from app.role.models import Role, RolePermission
from app.role.schemas import RoleCreate, RoleOut, RoleUpdate


def _to_out(role: Role) -> RoleOut:
    return RoleOut(
        id=role.id,
        name=role.name,
        description=role.description or "",
        permissions=sorted(rp.permission_code for rp in role.permissions),
        isPreset=bool(role.is_preset),
    )


async def list_roles(
    db: AsyncSession, search: str, pagination: Pagination
) -> tuple[list[RoleOut], int]:
    query = select(Role).options(selectinload(Role.permissions))
    if search:
        query = query.where(
            or_(
                Role.name.ilike(f"%{search}%"),
                Role.description.ilike(f"%{search}%"),
            )
        )

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    query = query.order_by(Role.id).offset(pagination.offset).limit(pagination.limit)
    roles = list((await db.execute(query)).scalars().unique().all())
    return [_to_out(role) for role in roles], total


async def get_role(db: AsyncSession, role_id: str) -> Role:
    role = (await db.execute(select(Role).where(Role.id == role_id))).scalar_one_or_none()
    if role is None:
        raise NotFoundError("角色不存在")
    return role


async def _replace_permissions(db: AsyncSession, role: Role, codes: list[str]) -> None:
    existing = (
        await db.execute(select(RolePermission).where(RolePermission.role_id == role.id))
    ).scalars().all()
    for item in existing:
        await db.delete(item)
    for code in dict.fromkeys(codes):
        db.add(RolePermission(role_id=role.id, permission_code=code))


async def create_role(db: AsyncSession, data: RoleCreate) -> RoleOut:
    role = Role(
        id=uuid.uuid4().hex[:8],
        name=data.name,
        description=data.description,
        is_preset=False,
    )
    db.add(role)
    await db.flush()
    await _replace_permissions(db, role, data.permissions)
    await db.flush()

    role = await get_role(db, role.id)
    return _to_out(role)


async def update_role(db: AsyncSession, role_id: str, data: RoleUpdate) -> RoleOut:
    role = await get_role(db, role_id)
    if data.name is not None:
        role.name = data.name
    if data.description is not None:
        role.description = data.description
    if data.permissions is not None:
        await _replace_permissions(db, role, data.permissions)
    await db.flush()

    role = await get_role(db, role_id)
    return _to_out(role)


async def delete_role(db: AsyncSession, role_id: str) -> None:
    role = await get_role(db, role_id)
    if role.is_preset:
        raise InvalidOperationError("预设角色不可删除")
    await db.delete(role)
    await db.flush()
