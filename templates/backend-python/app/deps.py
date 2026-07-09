from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.models import Role, RolePermission, User
from app.core.security import decode_access_token
from app.database import get_db

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未提供认证凭据",
        )
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的token",
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的token",
        )

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
        )
    return user


async def get_current_user_with_permissions(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> tuple[User, list[str]]:
    result = await db.execute(
        select(RolePermission.permission_code)
        .join(Role, Role.id == RolePermission.role_id)
        .where(Role.id == current_user.role_id)
    )
    permissions = [row[0] for row in result.all()]

    if current_user.role_id == "admin":
        result = await db.execute(select(RolePermission.permission_code))
        permissions = [row[0] for row in result.all()]

    return current_user, permissions


def require_permission(*required_codes: str):
    async def check_permission(
        user_with_perms: Annotated[tuple[User, list[str]], Depends(get_current_user_with_permissions)],
    ) -> User:
        user, permissions = user_with_perms
        if not any(code in permissions for code in required_codes):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="权限不足",
            )
        return user

    return check_permission
