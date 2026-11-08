"""认证领域的业务逻辑：登录、注册、登出。"""

import time

from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.schemas import AuthUser, LoginRequest, LoginResponse, RegisterRequest
from app.core import audit
from app.core.app_state import get_app_state
from app.core.deps import PermissionSet, load_permissions
from app.core.exceptions import AppError
from app.core.security import create_access_token
from app.system.service import get_config
from app.user.crud import authenticate_user, create_user, get_user_by_email, get_user_by_username
from app.user.models import User
from app.user.tokens import bump_token_version

PENDING_REVIEW_ROLE_ID = "pending_review"
ADMIN_ROLE_ID = "admin"
DEFAULT_ROLE_ID = "user"

# 简易速率限制：{key: [timestamp, ...]}
_rate_limit_store: dict[str, list[float]] = {}
RATE_LIMIT_MAX = 5
RATE_LIMIT_WINDOW = 60  # 秒


def is_rate_limited(key: str) -> bool:
    """返回 True 表示该 key 在窗口内已超限。"""
    now = time.time()
    recent = [t for t in _rate_limit_store.get(key, []) if now - t < RATE_LIMIT_WINDOW]
    if len(recent) >= RATE_LIMIT_MAX:
        _rate_limit_store[key] = recent
        return True
    recent.append(now)
    _rate_limit_store[key] = recent
    return False


def build_login_response(user: User, permissions: PermissionSet, token: str) -> dict:
    return LoginResponse(
        token=token,
        user=AuthUser(
            id=str(user.id),
            name=user.name,
            email=user.email,
            avatar=user.avatar or "",
            role=user.role_id,
            permissions=sorted(permissions.codes),
        ),
    ).model_dump()


async def _issue_token(db: AsyncSession, user: User) -> dict:
    state = await get_app_state(db)
    token = create_access_token(
        data={
            "sub": str(user.id),
            "epoch": state.session_epoch,
            "ver": user.token_version or 0,
        }
    )
    permissions = await load_permissions(db, user)
    return build_login_response(user, permissions, token)


async def login(db: AsyncSession, request: LoginRequest, client_ip: str) -> dict:
    if is_rate_limited(f"login:{client_ip}"):
        raise AppError("登录尝试过于频繁，请稍后再试")

    user = await authenticate_user(db, request.account, request.password)
    if user is None:
        await audit.record(
            action="login",
            ip=client_ip,
            status="fail",
            username=request.account,
            detail="账号或密码错误",
        )
        raise AppError("账号或密码错误")

    if user.role_id == PENDING_REVIEW_ROLE_ID:
        await audit.record(
            action="login",
            ip=client_ip,
            status="fail",
            user_id=user.id,
            username=user.username,
            detail="账号正在审核中",
        )
        raise AppError("账号正在审核中，请等待管理员批准")

    config = await get_config(db)
    if config.maintenance_enabled and user.role_id != ADMIN_ROLE_ID:
        await audit.record(
            action="login",
            ip=client_ip,
            status="fail",
            user_id=user.id,
            username=user.username,
            detail=config.maintenance_message or "系统维护中",
        )
        raise AppError(config.maintenance_message or "系统维护中")

    payload = await _issue_token(db, user)
    await audit.record(
        action="login",
        ip=client_ip,
        status="success",
        user_id=user.id,
        username=user.username,
    )
    return payload


async def register(db: AsyncSession, request: RegisterRequest, client_ip: str) -> dict | None:
    """注册成功且无需审核时返回登录载荷，需要审核时返回 None。"""
    if is_rate_limited(f"register:{client_ip}"):
        raise AppError("注册尝试过于频繁，请稍后再试")

    config = await get_config(db)
    if not config.open_registration:
        await audit.record(
            action="register",
            ip=client_ip,
            status="fail",
            username=request.username,
            detail="注册已关闭",
        )
        raise AppError("注册已关闭")

    if await get_user_by_username(db, request.username):
        await audit.record(
            action="register",
            ip=client_ip,
            status="fail",
            username=request.username,
            detail="用户名已存在",
        )
        raise AppError("用户名已存在")

    if await get_user_by_email(db, request.email):
        await audit.record(
            action="register",
            ip=client_ip,
            status="fail",
            username=request.username,
            detail="邮箱已被注册",
        )
        raise AppError("邮箱已被注册")

    role_id = PENDING_REVIEW_ROLE_ID if config.manual_review else DEFAULT_ROLE_ID
    user = await create_user(
        db,
        username=request.username,
        name=request.username,
        email=request.email,
        role_id=role_id,
        password=request.password,
    )
    await audit.record(
        action="register",
        ip=client_ip,
        status="success",
        user_id=user.id,
        username=user.username,
    )

    if role_id == PENDING_REVIEW_ROLE_ID:
        return None
    return await _issue_token(db, user)


async def logout(db: AsyncSession, user: User, client_ip: str) -> None:
    """登出：递增令牌版本，使该用户所有既有令牌立即失效。"""
    await bump_token_version(db, user)
    await audit.record(
        action="logout",
        ip=client_ip,
        status="success",
        user_id=user.id,
        username=user.username,
    )
