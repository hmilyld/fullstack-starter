"""用户领域的业务逻辑。

router 只负责 HTTP 映射（解析入参、返回信封），所有判定与写入都在这里，
以便事务边界清晰：抛异常即整体回滚，绝不会"先写库再返回 code -1"。
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import PermissionSet
from app.core.exceptions import ConflictError, ForbiddenError, InvalidOperationError, NotFoundError
from app.core.security import hash_password, verify_password
from app.user import crud
from app.user.models import User
from app.user.schemas import (
    BatchRoleUpdateRequest,
    ChangePasswordRequest,
    ResetPasswordRequest,
    UpdateMeRequest,
    UserCreate,
    UserUpdate,
)
from app.user.tokens import bump_token_version

ADMIN_ROLE_ID = "admin"
DEFAULT_ROLE_ID = "user"


async def list_users(db: AsyncSession, search: str, page: int, page_size: int) -> tuple[list[User], int]:
    return await crud.get_users(db, search, page, page_size)


async def get_user(db: AsyncSession, user_id: int) -> User:
    user = await crud.get_user_by_id(db, user_id)
    if user is None:
        raise NotFoundError("用户不存在")
    return user


async def create_user(db: AsyncSession, data: UserCreate, actor: PermissionSet) -> User:
    if await crud.get_user_by_username(db, data.username):
        raise ConflictError("用户名已存在")
    if await crud.get_user_by_email(db, data.email):
        raise ConflictError("邮箱已被注册")
    # 创建非默认角色的用户需要角色维护权限，避免 users.create 单独提权
    if data.roleId != DEFAULT_ROLE_ID and "users.assign_role" not in actor.permissions:
        raise ForbiddenError()
    return await crud.create_user(
        db,
        username=data.username,
        name=data.name,
        email=data.email,
        role_id=data.roleId,
        password=data.password,
    )


async def update_user(
    db: AsyncSession,
    user_id: int,
    data: UserUpdate,
    actor: User,
    actor_permissions: PermissionSet,
) -> User:
    user = await crud.get_user_by_id(db, user_id)
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
    return await crud.update_user(db, user, **changes)


async def delete_user(db: AsyncSession, user_id: int, actor: User) -> None:
    user = await crud.get_user_by_id(db, user_id)
    if user is None:
        raise NotFoundError("用户不存在")
    if user.id == actor.id:
        raise InvalidOperationError("不能删除自己")
    if user.role_id == ADMIN_ROLE_ID:
        if actor.role_id != ADMIN_ROLE_ID:
            raise ForbiddenError()
        if await crud.count_users_by_role(db, ADMIN_ROLE_ID) <= 1:
            raise InvalidOperationError("不能删除最后一个管理员")
    await crud.delete_user(db, user)


async def reset_password(db: AsyncSession, user_id: int, data: ResetPasswordRequest, actor: User) -> None:
    user = await crud.get_user_by_id(db, user_id)
    if user is None:
        raise NotFoundError("用户不存在")
    if user.role_id == ADMIN_ROLE_ID and actor.role_id != ADMIN_ROLE_ID:
        raise ForbiddenError()
    await crud.change_password(db, user, data.newPassword)
    # 管理员重置密码后，该用户所有既有令牌失效
    await bump_token_version(db, user)


async def batch_update_role(
    db: AsyncSession, data: BatchRoleUpdateRequest, actor: User
) -> int:
    applied = 0
    for user_id in data.userIds:
        user = await crud.get_user_by_id(db, user_id)
        if user is None:
            continue
        # 跳过自己，不允许批量修改自己的角色
        if user.id == actor.id:
            continue
        # 管理员角色不可被降级（除非操作者也是管理员）
        if user.role_id == ADMIN_ROLE_ID and actor.role_id != ADMIN_ROLE_ID:
            continue
        await crud.update_user(db, user, role_id=data.roleId)
        applied += 1
    return applied


async def update_me(db: AsyncSession, data: UpdateMeRequest, actor: User) -> User:
    if data.email != actor.email:
        if await crud.get_user_by_email(db, data.email):
            raise ConflictError("邮箱已被注册")
    return await crud.update_user(db, actor, name=data.name, email=data.email)


async def change_password(db: AsyncSession, data: ChangePasswordRequest, actor: User) -> None:
    if not verify_password(data.currentPassword, actor.password_hash):
        raise InvalidOperationError("当前密码错误")
    await crud.change_password(db, actor, data.newPassword)
    # 改密后吊销该用户所有既有令牌
    await bump_token_version(db, actor)


__all__ = [
    "ADMIN_ROLE_ID",
    "DEFAULT_ROLE_ID",
    "batch_update_role",
    "change_password",
    "create_user",
    "delete_user",
    "get_user",
    "hash_password",
    "list_users",
    "reset_password",
    "update_me",
    "update_user",
]
