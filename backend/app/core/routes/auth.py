from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import crud
from app.core.schemas import (
    ApiResponse,
    AuthUser,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
)
from app.core.security import create_access_token
from app.database import get_db
from app.deps import get_current_user_with_permissions
from app.modules.system.crud import get_config

router = APIRouter(prefix="/auth", tags=["认证"])


def _build_login_response(user, permissions: list[str], token: str) -> dict:
    return LoginResponse(
        token=token,
        user=AuthUser(
            id=str(user.id),
            name=user.name,
            email=user.email,
            avatar=user.avatar or "",
            role=user.role_id,
            permissions=permissions,
        ),
    ).model_dump()


@router.post("/login")
async def login(
    request: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ApiResponse:
    user = await crud.authenticate_user(db, request.account, request.password)
    if user is None:
        return ApiResponse(code=-1, message="账号或密码错误")

    if user.role_id == "pending_review":
        return ApiResponse(code=-1, message="账号正在审核中，请等待管理员批准")

    config = await get_config(db)
    if config.maintenance_enabled and user.role_id != "admin":
        return ApiResponse(code=-1, message=config.maintenance_message or "系统维护中")

    token = create_access_token(data={"sub": str(user.id)})
    _, permissions = await get_current_user_with_permissions(user, db)
    return ApiResponse(data=_build_login_response(user, permissions, token))


@router.post("/register")
async def register(
    request: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ApiResponse:
    config = await get_config(db)
    if not config.open_registration:
        return ApiResponse(code=-1, message="注册已关闭")

    if await crud.get_user_by_username(db, request.username):
        return ApiResponse(code=-1, message="用户名已存在")
    if await crud.get_user_by_email(db, request.email):
        return ApiResponse(code=-1, message="邮箱已被注册")

    role_id = "pending_review" if config.manual_review else "user"
    user = await crud.create_user(
        db,
        username=request.username,
        name=request.username,
        email=request.email,
        role_id=role_id,
        password=request.password,
    )

    if role_id == "pending_review":
        return ApiResponse(message="注册成功，请等待管理员审核")

    token = create_access_token(data={"sub": str(user.id)})
    _, permissions = await get_current_user_with_permissions(user, db)
    return ApiResponse(data=_build_login_response(user, permissions, token))


@router.post("/logout")
async def logout() -> ApiResponse:
    return ApiResponse()
