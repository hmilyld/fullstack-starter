from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import crud
from app.core.models import User
from app.core.schemas import (
    ApiResponse,
    BatchRoleUpdateRequest,
    ChangePasswordRequest,
    PaginatedData,
    ResetPasswordRequest,
    UpdateMeRequest,
    UserCreate,
    UserOut,
    UserUpdate,
)
from app.database import get_db
from app.deps import get_current_user, require_permission

router = APIRouter(prefix="/users", tags=["用户"])


@router.get("")
async def get_users(
    search: str = "",
    page: int = 1,
    pageSize: int = 10,
    current_user: User = Depends(require_permission("users")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    users, total = await crud.get_users(db, search, page, pageSize)
    return ApiResponse(
        data=PaginatedData(
            list=[UserOut.from_orm_model(u).model_dump() for u in users], total=total, page=page, pageSize=pageSize
        ).model_dump()
    )


@router.get("/{user_id}")
async def get_user(
    user_id: int,
    current_user: User = Depends(require_permission("users")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    user = await crud.get_user_by_id(db, user_id)
    if user is None:
        return ApiResponse(code=-1, message="用户不存在")
    return ApiResponse(data=UserOut.from_orm_model(user).model_dump())


@router.post("")
async def create_user(
    data: UserCreate,
    current_user: User = Depends(require_permission("users.create")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    if await crud.get_user_by_username(db, data.username):
        return ApiResponse(code=-1, message="用户名已存在")
    if await crud.get_user_by_email(db, data.email):
        return ApiResponse(code=-1, message="邮箱已被注册")
    user = await crud.create_user(
        db, username=data.username, name=data.name, email=data.email, role_id=data.roleId, password=data.password
    )
    return ApiResponse(data=UserOut.from_orm_model(user).model_dump())


@router.put("/{user_id}")
async def update_user(
    user_id: int,
    data: UserUpdate,
    current_user: User = Depends(require_permission("users.edit")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    user = await crud.get_user_by_id(db, user_id)
    if user is None:
        return ApiResponse(code=-1, message="用户不存在")
    update_data = data.model_dump(exclude_unset=True)
    if "roleId" in update_data:
        update_data["role_id"] = update_data.pop("roleId")
    updated = await crud.update_user(db, user, **update_data)
    return ApiResponse(data=UserOut.from_orm_model(updated).model_dump())


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_permission("users.delete")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    user = await crud.get_user_by_id(db, user_id)
    if user is None:
        return ApiResponse(code=-1, message="用户不存在")
    await crud.delete_user(db, user)
    return ApiResponse()


@router.put("/{user_id}/reset-password")
async def reset_password(
    user_id: int,
    data: ResetPasswordRequest,
    current_user: User = Depends(require_permission("users.edit")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    user = await crud.get_user_by_id(db, user_id)
    if user is None:
        return ApiResponse(code=-1, message="用户不存在")
    await crud.change_password(db, user, data.newPassword)
    return ApiResponse()


@router.post("/batch-role")
async def batch_update_role(
    data: BatchRoleUpdateRequest,
    current_user: User = Depends(require_permission("users.edit")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    for user_id in data.userIds:
        user = await crud.get_user_by_id(db, user_id)
        if user:
            await crud.update_user(db, user, role_id=data.roleId)
    return ApiResponse()


@router.put("/me")
async def update_me(
    data: UpdateMeRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    if data.email != current_user.email:
        existing = await crud.get_user_by_email(db, data.email)
        if existing:
            return ApiResponse(code=-1, message="邮箱已被注册")
    updated = await crud.update_user(db, current_user, name=data.name, email=data.email)
    return ApiResponse(data=UserOut.model_validate(updated).model_dump())


@router.put("/me/password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    from app.core.security import verify_password

    if not verify_password(data.currentPassword, current_user.password_hash):
        return ApiResponse(code=-1, message="当前密码错误")
    await crud.change_password(db, current_user, data.newPassword)
    return ApiResponse()
