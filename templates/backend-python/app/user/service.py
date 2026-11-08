"""用户领域的业务逻辑。

router 只负责 HTTP 映射，所有判定与写入都在这里，
以便事务边界清晰：抛异常即整体回滚，绝不会「先写库再返回 code -1」。
"""

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import PermissionSet
from app.core.exceptions import (
    ConflictError,
    ForbiddenError,
    InvalidOperationError,
    NotFoundError,
)
from app.core.security import hash_password, verify_password
from app.user.models import User
from app.user.schemas import (
    BatchRoleUpdateRequest,
    ChangePasswordRequest,
    ResetPasswordRequest,
    UpdateMeRequest,
    UserCreate,
    UserOut,
    UserUpdate,
)
from app.user.tokens import bump_token_version

ADMIN_ROLE_ID = "admin"
DEFAULT_ROLE_ID = "user"

# 允许通过 update_user 更新的字段白名单，防止未来扩展时误写入敏感字段
_UPDATABLE_USER_FIELDS = {"username", "name", "email", "role_id", "avatar"}


# ---------------------------------------------------------------- 查询


async def get_users(
    db: AsyncSession,
    search: str = "",
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[User], int]:
    query = select(User)
    if search:
        query = query.where(
            or_(
                User.username.ilike(f"%{search}%"),
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
            )
        )

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    query = query.order_by(User.id).offset((page - 1) * page_size).limit(page_size)
    users = list((await db.execute(query)).scalars().all())
    return users, total


async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    return (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()


async def get_user_by_username(db: AsyncSession, username: str) -> User | None:
    return (await db.execute(select(User).where(User.username == username))).scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    return (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()


async def count_users_by_role(db: AsyncSession, role_id: str) -> int:
    return (
        await db.execute(select(func.count()).select_from(User).where(User.role_id == role_id))
    ).scalar() or 0


async def authenticate_user(db: AsyncSession, account: str, password: str) -> User | None:
    user = await get_user_by_username(db, account) or await get_user_by_email(db, account)
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user


# ---------------------------------------------------------------- 写入


async def create_user(
    db: AsyncSession,
    username: str,
    name: str,
    email: str,
    role_id: str,
    password: str,
) -> User:
    user = User(
        username=username,
        name=name,
        email=email,
        role_id=role_id,
        password_hash=hash_password(password),
    )
    db.add(user)
    await db.flush()
    return user


async def update_user(db: AsyncSession, user: User, **kwargs) -> User:
    for key, value in kwargs.items():
        if key not in _UPDATABLE_USER_FIELDS:
            raise ValueError(f"不允许更新用户字段: {key}")
        if value is not None:
            setattr(user, key, value)
    await db.flush()
    return user


async def delete_user(db: AsyncSession, user: User) -> None:
    await db.delete(user)
    await db.flush()


async def change_password(db: AsyncSession, user: User, new_password: str) -> None:
    user.password_hash = hash_password(new_password)
    await db.flush()


# ---------------------------------------------------------------- 用例


async def list_users(
    db: AsyncSession, search: str, page: int, page_size: int
) -> tuple[list[UserOut], int]:
    users, total = await get_users(db, search, page, page_size)
    return [UserOut.from_orm_model(user) for user in users], total


async def get_user_out(db: AsyncSession, user_id: int) -> UserOut:
    user = await get_user_by_id(db, user_id)
    if user is None:
        raise NotFoundError("用户不存在")
    return UserOut.from_orm_model(user)


async def create_user_out(db: AsyncSession, data: UserCreate, actor: PermissionSet) -> UserOut:
    if await get_user_by_username(db, data.username):
        raise ConflictError("用户名已存在")
    if await get_user_by_email(db, data.email):
        raise ConflictError("邮箱已被注册")
    # 创建非默认角色的用户需要角色维护权限，避免 users.create 单独提权
    if data.roleId != DEFAULT_ROLE_ID and "users.assign_role" not in actor.permissions:
        raise ForbiddenError()
    user = await create_user(
        db,
        username=data.username,
        name=data.name,
        email=data.email,
        role_id=data.roleId,
        password=data.password,
    )
    return UserOut.from_orm_model(user)


async def update_user_out(
    db: AsyncSession,
    user_id: int,
    data: UserUpdate,
    actor: User,
    actor_permissions: PermissionSet,
) -> UserOut:
    user = await get_user_by_id(db, user_id)
    if user is None:
        raise NotFoundError("用户不存在")

    if user.role_id == ADMIN_ROLE_ID and actor.role_id != ADMIN_ROLE_ID:
        raise ForbiddenError()

    changes = data.model_dump(exclude_unset=True)
    role_changed = "roleId" in changes and changes["roleId"] != user.role_id
    if role_changed:
        if user.id == actor.id:
            if user.role_id == ADMIN_ROLE_ID:
                raise InvalidOperationError("不能降级自己的管理员角色")
            raise InvalidOperationError("不能修改自己的角色")
        # 角色变更必须拥有独立的 assign_role 权限
        if "users.assign_role" not in actor_permissions.permissions:
            raise ForbiddenError()
    if "roleId" in changes:
        changes["role_id"] = changes.pop("roleId")
    return UserOut.from_orm_model(await update_user(db, user, **changes))


async def delete_user_by_id(db: AsyncSession, user_id: int, actor: User) -> None:
    user = await get_user_by_id(db, user_id)
    if user is None:
        raise NotFoundError("用户不存在")
    if user.id == actor.id:
        raise InvalidOperationError("不能删除自己")
    if user.role_id == ADMIN_ROLE_ID:
        if actor.role_id != ADMIN_ROLE_ID:
            raise ForbiddenError()
        if await count_users_by_role(db, ADMIN_ROLE_ID) <= 1:
            raise InvalidOperationError("不能删除最后一个管理员")
    await delete_user(db, user)


async def reset_user_password(
    db: AsyncSession, user_id: int, data: ResetPasswordRequest, actor: User
) -> None:
    user = await get_user_by_id(db, user_id)
    if user is None:
        raise NotFoundError("用户不存在")
    if user.role_id == ADMIN_ROLE_ID and actor.role_id != ADMIN_ROLE_ID:
        raise ForbiddenError()
    await change_password(db, user, data.newPassword)
    # 管理员重置密码后，该用户所有既有令牌失效
    await bump_token_version(db, user)


async def batch_update_role(db: AsyncSession, data: BatchRoleUpdateRequest, actor: User) -> int:
    applied = 0
    for user_id in data.userIds:
        user = await get_user_by_id(db, user_id)
        if user is None:
            continue
        # 跳过自己，不允许批量修改自己的角色
        if user.id == actor.id:
            continue
        # 管理员角色不可被降级（除非操作者也是管理员）
        if user.role_id == ADMIN_ROLE_ID and actor.role_id != ADMIN_ROLE_ID:
            continue
        await update_user(db, user, role_id=data.roleId)
        applied += 1
    return applied


async def update_me(db: AsyncSession, data: UpdateMeRequest, actor: User) -> UserOut:
    if data.email != actor.email and await get_user_by_email(db, data.email):
        raise ConflictError("邮箱已被注册")
    return UserOut.from_orm_model(
        await update_user(db, actor, name=data.name, email=data.email)
    )


async def change_own_password(
    db: AsyncSession, data: ChangePasswordRequest, actor: User
) -> None:
    if not verify_password(data.currentPassword, actor.password_hash):
        raise InvalidOperationError("当前密码错误")
    await change_password(db, actor, data.newPassword)
    # 改密后吊销该用户所有既有令牌
    await bump_token_version(db, actor)
