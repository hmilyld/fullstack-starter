from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.schemas import LoginRequest, LoginResponse, RegisterRequest
from app.auth.service import login as login_service
from app.auth.service import logout as logout_service
from app.auth.service import register as register_service
from app.core import audit
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.schemas import ApiResponse
from app.user.models import User

router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/login")
async def login(
    request: LoginRequest,
    req: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ApiResponse[LoginResponse]:
    return ApiResponse(data=await login_service(db, request, audit.get_client_ip(req)))


@router.post("/register")
async def register(
    request: RegisterRequest,
    req: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ApiResponse[LoginResponse]:
    payload = await register_service(db, request, audit.get_client_ip(req))
    if payload is None:
        return ApiResponse(message="注册成功，请等待管理员审核")
    return ApiResponse(data=payload)


@router.post("/logout")
async def logout(
    req: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ApiResponse[None]:
    await logout_service(db, current_user, audit.get_client_ip(req))
    return ApiResponse()
