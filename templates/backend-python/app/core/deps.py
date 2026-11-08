"""认证与授权的依赖注入。

契约要求：
- 只按权限码判定，不按角色名判定；
- 唯一允许的角色名判断是 ``admin`` 角色视为拥有全部权限，
  且只在这里实现一次，不散落到业务代码。
"""

from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.app_state import get_app_state
from app.core.database import get_db
from app.core.exceptions import AuthError, ForbiddenError
from app.core.security import decode_access_token
from app.role.models import Role, RolePermission
from app.user.models import User

ADMIN_ROLE_ID = "admin"

security = HTTPBearer(auto_error=False)

Credentials = Annotated[HTTPAuthorizationCredentials | None, Depends(security)]
DbSession = Annotated[AsyncSession, Depends(get_db)]


@dataclass(frozen=True)
class PermissionSet:
    """当前用户拥有的权限码集合。"""

    codes: frozenset[str]

    def __contains__(self, code: object) -> bool:
        return code in self.codes

    def any_of(self, *required: str) -> bool:
        return any(code in self.codes for code in required)


@dataclass(frozen=True)
class Principal:
    """已认证用户 + 其权限集合。"""

    user: User
    permissions: PermissionSet


async def get_current_user(credentials: Credentials, db: DbSession) -> User:
    if credentials is None:
        raise AuthError("未提供认证凭据")
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = payload.get("sub")
        if user_id is None:
            raise ValueError("缺少用户标识")
        user_id = int(user_id)
    except AuthError:
        raise
    except Exception as exc:
        raise AuthError("无效的token") from exc

    state = await get_app_state(db)
    if payload.get("epoch") != state.session_epoch:
        raise AuthError("登录状态已失效，请重新登录")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise AuthError("用户不存在")

    # 令牌版本比对：登出/改密后旧令牌立即失效
    if payload.get("ver", 0) != (user.token_version or 0):
        raise AuthError("登录状态已失效，请重新登录")
    return user


async def load_permissions(db: AsyncSession, user: User) -> PermissionSet:
    """解析权限码。``admin`` 角色拥有全部权限——唯一的角色名判断。"""
    if user.role_id == ADMIN_ROLE_ID:
        result = await db.execute(select(RolePermission.permission_code))
    else:
        result = await db.execute(
            select(RolePermission.permission_code)
            .join(Role, Role.id == RolePermission.role_id)
            .where(Role.id == user.role_id)
        )
    return PermissionSet(frozenset(row[0] for row in result.all()))


async def get_principal(
    current_user: Annotated[User, Depends(get_current_user)],
    db: DbSession,
) -> Principal:
    return Principal(user=current_user, permissions=await load_permissions(db, current_user))


def require_permission(*required_codes: str):
    """要求拥有任意一个给定权限码（OR 语义，与契约一致）。"""

    async def check_permission(
        principal: Annotated[Principal, Depends(get_principal)],
    ) -> User:
        if not principal.permissions.any_of(*required_codes):
            raise ForbiddenError()
        return principal.user

    return check_permission
