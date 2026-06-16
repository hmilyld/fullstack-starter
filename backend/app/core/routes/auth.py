import time
from typing import Annotated

from fastapi import APIRouter, Depends, Request
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

# 简易速率限制：{key: [(timestamp, count)]}
_rate_limit_store: dict[str, list[float]] = {}
RATE_LIMIT_MAX = 5
RATE_LIMIT_WINDOW = 60  # 秒


def _check_rate_limit(key: str) -> bool:
    """检查是否超过速率限制，返回 True 表示被限制"""
    now = time.time()
    # 清理过期记录
    _rate_limit_store[key] = [t for t in _rate_limit_store.get(key, []) if now - t < RATE_LIMIT_WINDOW]
    if len(_rate_limit_store.get(key, [])) >= RATE_LIMIT_MAX:
        return True
    _rate_limit_store.setdefault(key, []).append(now)
    return False


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
    req: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ApiResponse:
    # 速率限制：按 IP 地址
    client_ip = req.client.host if req.client else "unknown"
    if _check_rate_limit(f"login:{client_ip}"):
        return ApiResponse(code=-1, message="登录尝试过于频繁，请稍后再试")

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
    req: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ApiResponse:
    # 速率限制：按 IP 地址
    client_ip = req.client.host if req.client else "unknown"
    if _check_rate_limit(f"register:{client_ip}"):
        return ApiResponse(code=-1, message="注册尝试过于频繁，请稍后再试")

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
