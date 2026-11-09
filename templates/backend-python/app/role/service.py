"""角色领域的业务逻辑。"""

import uuid

from sqlalchemy import delete, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import InvalidOperationError, NotFoundError
from app.core.pagination import Pagination
from app.role.models import Role, RolePermission
from app.role.schemas import RoleCreate, RoleOut, RoleUpdate
from app.system.models import SystemConfig
from app.user.models import User

# 默认角色的兜底值：system_config 未配置或指向不可用角色时使用
DEFAULT_ROLE_ID = "user"
CONFIG_ID = 1


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

    # 该角色下的用户先转交到默认角色，避免 users.role_id 指向已删除的角色。
    # 前端删除确认框的文案就是按这个语义写的：「已分配该角色的用户将失去对应权限」。
    fallback_role_id = await _fallback_role_id(db, role_id)
    await db.execute(
        update(User).where(User.role_id == role_id).values(role_id=fallback_role_id)
    )
    # 与 Java 侧 deleteByRoleId 一致：显式删除授权，不依赖关系的懒加载级联
    await db.execute(delete(RolePermission).where(RolePermission.role_id == role_id))
    await db.delete(role)
    await db.flush()


async def _fallback_role_id(db: AsyncSession, deleting_role_id: str) -> str:
    """删除角色时把其下用户转交给哪个角色。

    优先用系统设置里的 ``default_role_id``；它指向正在删除的角色、
    已不存在或本身就是预设之外的空值时，退回 ``user`` 角色。
    """
    config = (
        await db.execute(select(SystemConfig).where(SystemConfig.id == CONFIG_ID))
    ).scalar_one_or_none()
    candidates = [config.default_role_id if config else None, DEFAULT_ROLE_ID]
    for candidate in candidates:
        if not candidate or candidate == deleting_role_id:
            continue
        exists = (
            await db.execute(select(Role.id).where(Role.id == candidate))
        ).scalar_one_or_none()
        if exists is not None:
            return candidate
    raise InvalidOperationError("找不到可用的默认角色，请先在系统设置中配置默认角色")
