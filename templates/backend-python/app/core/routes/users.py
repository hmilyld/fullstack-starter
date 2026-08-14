from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
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
from app.deps import get_current_user, get_current_user_with_permissions, require_permission

router = APIRouter(prefix="/users", tags=["用户"])


# ============================================================
# 公开/自身操作路由 (固定路径，必须在 /{user_id} 之前)
# ============================================================


@router.get("")
async def get_users(
    search: str = "",
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    current_user: User = Depends(require_permission("users")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    users, total = await crud.get_users(db, search, page, pageSize)
    return ApiResponse(
        data=PaginatedData(
            list=[UserOut.from_orm_model(u).model_dump() for u in users], total=total, page=page, pageSize=pageSize
        ).model_dump()
    )


@router.post("")
async def create_user(
    data: UserCreate,
    current_user: User = Depends(require_permission("users.create")),
    user_with_permissions: tuple[User, list[str]] = Depends(get_current_user_with_permissions),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    if await crud.get_user_by_username(db, data.username):
        return ApiResponse(code=-1, message="用户名已存在")
    if await crud.get_user_by_email(db, data.email):
        return ApiResponse(code=-1, message="邮箱已被注册")
    # 创建非默认角色的用户需要角色维护权限，避免 users.create 单独提权
    _, permissions = user_with_permissions
    if data.roleId != "user" and "users.assign_role" not in permissions:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="权限不足")
    user = await crud.create_user(
        db, username=data.username, name=data.name, email=data.email, role_id=data.roleId, password=data.password
    )
    return ApiResponse(data=UserOut.from_orm_model(user).model_dump())


@router.post("/batch-role")
async def batch_update_role(
    data: BatchRoleUpdateRequest,
    current_user: User = Depends(require_permission("users.edit", "users.assign_role")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    applied = 0
    for user_id in data.userIds:
        user = await crud.get_user_by_id(db, user_id)
        if user is None:
            continue
        # 跳过自己，不允许批量修改自己的角色
        if user.id == current_user.id:
            continue
        # 管理员角色不可被降级（除非操作者也是管理员）
        if user.role_id == "admin" and current_user.role_id != "admin":
            continue
        await crud.update_user(db, user, role_id=data.roleId)
        applied += 1
    return ApiResponse(data={"applied": applied})


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
    return ApiResponse(data=UserOut.from_orm_model(updated).model_dump())


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


# ============================================================
# 带 ID 参数的路由 (必须在固定路径之后)
# ============================================================


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


@router.put("/{user_id}")
async def update_user(
    user_id: int,
    data: UserUpdate,
    current_user: User = Depends(require_permission("users.edit", "users.assign_role")),
    user_with_permissions: tuple[User, list[str]] = Depends(get_current_user_with_permissions),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    user = await crud.get_user_by_id(db, user_id)
    if user is None:
        return ApiResponse(code=-1, message="用户不存在")
    # 非管理员不能修改管理员用户
    if user.role_id == "admin" and current_user.role_id != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="权限不足")
    update_data = data.model_dump(exclude_unset=True)
    role_changed = "roleId" in update_data and update_data["roleId"] != user.role_id
    if role_changed:
        # 不能修改自己的角色
        if user.id == current_user.id:
            if user.role_id == "admin":
                return ApiResponse(code=-1, message="不能降级自己的管理员角色")
            return ApiResponse(code=-1, message="不能修改自己的角色")
        # 角色变更必须拥有独立的 assign_role 权限
        _, permissions = user_with_permissions
        if "users.assign_role" not in permissions:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="权限不足")
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
    # 不能删除自己
    if user.id == current_user.id:
        return ApiResponse(code=-1, message="不能删除自己")
    # 非管理员不能删除管理员用户
    if user.role_id == "admin" and current_user.role_id != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="权限不足")
    # 不能删除最后一个管理员
    if user.role_id == "admin":
        admin_count = await crud.count_users_by_role(db, "admin")
        if admin_count <= 1:
            return ApiResponse(code=-1, message="不能删除最后一个管理员")
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
    # 非管理员不能重置管理员用户的密码
    if user.role_id == "admin" and current_user.role_id != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="权限不足")
    await crud.change_password(db, user, data.newPassword)
    return ApiResponse()
