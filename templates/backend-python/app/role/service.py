"""角色领域的业务逻辑。"""

import uuid

from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import InvalidOperationError, NotFoundError
from app.core.pagination import Pagination
from app.role.models import Role, RolePermission
from app.role.schemas import RoleCreate, RoleOut, RoleUpdate


def _to_out(role: Role, permission_codes: list[str]) -> RoleOut:
    return RoleOut(
        id=role.id,
        name=role.name,
        description=role.description or "",
        permissions=sorted(permission_codes),
        isPreset=bool(role.is_preset),
    )


async def _permission_codes(db: AsyncSession, role_id: str) -> list[str]:
    """显式查询角色的权限码。

    不要在异步会话里遍历 ``role.permissions``：它是懒加载关系，在 greenlet 之外
    触发 IO 会抛 ``MissingGreenlet``；而且写操作之后 identity map 里已加载的集合
    不会因为 ``selectinload`` 刷新，返回的会是更新前的旧权限。
    """
    result = await db.execute(
        select(RolePermission.permission_code).where(RolePermission.role_id == role_id)
    )
    return list(result.scalars().all())


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
    return [
        _to_out(role, [item.permission_code for item in role.permissions]) for role in roles
    ], total


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

    return _to_out(role, await _permission_codes(db, role.id))


async def update_role(db: AsyncSession, role_id: str, data: RoleUpdate) -> RoleOut:
    role = await get_role(db, role_id)
    if data.name is not None:
        role.name = data.name
    if data.description is not None:
        role.description = data.description
    if data.permissions is not None:
        await _replace_permissions(db, role, data.permissions)
    await db.flush()

    return _to_out(role, await _permission_codes(db, role_id))


async def delete_role(db: AsyncSession, role_id: str) -> None:
    role = await get_role(db, role_id)
    if role.is_preset:
        raise InvalidOperationError("预设角色不可删除")
    # 与 Java 侧 deleteByRoleId 一致：显式删除授权，不依赖关系的懒加载级联
    await db.execute(delete(RolePermission).where(RolePermission.role_id == role_id))
    await db.delete(role)
    await db.flush()
