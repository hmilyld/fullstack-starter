from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import Principal, get_current_user, get_principal, require_permission
from app.core.pagination import Pagination, pagination_params
from app.core.schemas import ApiResponse, PaginatedData
from app.user import service
from app.user.models import User
from app.user.schemas import (
    BatchRoleResult,
    BatchRoleUpdateRequest,
    ChangePasswordRequest,
    ResetPasswordRequest,
    UpdateMeRequest,
    UserCreate,
    UserOut,
    UserUpdate,
)

router = APIRouter(prefix="/users", tags=["用户"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
PaginationDep = Annotated[Pagination, Depends(pagination_params)]
CurrentUser = Annotated[User, Depends(get_current_user)]
PrincipalDep = Annotated[Principal, Depends(get_principal)]


# ============================================================
# 自身操作路由（固定路径，必须在 /{user_id} 之前）
# ============================================================


@router.put("/me")
async def update_me(
    data: UpdateMeRequest, current_user: CurrentUser, db: DbSession
) -> ApiResponse[UserOut]:
    return ApiResponse(data=await service.update_me(db, data, current_user))


@router.put("/me/password")
async def change_password(
    data: ChangePasswordRequest, current_user: CurrentUser, db: DbSession
) -> ApiResponse[None]:
    await service.change_own_password(db, data, current_user)
    return ApiResponse()


@router.post("/batch-role")
async def batch_update_role(
    data: BatchRoleUpdateRequest,
    current_user: Annotated[User, Depends(require_permission("users.edit", "users.assign_role"))],
    db: DbSession,
) -> ApiResponse[BatchRoleResult]:
    applied = await service.batch_update_role(db, data, current_user)
    return ApiResponse(data=BatchRoleResult(applied=applied))


# ============================================================
# 列表与创建
# ============================================================


@router.get("")
async def get_users(
    current_user: Annotated[User, Depends(require_permission("users"))],
    db: DbSession,
    pagination: PaginationDep,
    search: str = "",
) -> ApiResponse[PaginatedData[UserOut]]:
    users, total = await service.list_users(db, search, pagination)
    return ApiResponse(
        data=PaginatedData[UserOut](
            list=users,
            total=total,
            page=pagination.page,
            pageSize=pagination.page_size,
        )
    )


@router.post("")
async def create_user(
    data: UserCreate,
    principal: PrincipalDep,
    current_user: Annotated[User, Depends(require_permission("users.create"))],
    db: DbSession,
) -> ApiResponse[UserOut]:
    return ApiResponse(data=await service.create_user_out(db, data, principal.permissions))


# ============================================================
# 带 ID 参数的路由（必须在固定路径之后）
# ============================================================


@router.get("/{user_id}")
async def get_user(
    user_id: int,
    current_user: Annotated[User, Depends(require_permission("users"))],
    db: DbSession,
) -> ApiResponse[UserOut]:
    return ApiResponse(data=await service.get_user_out(db, user_id))


@router.put("/{user_id}")
async def update_user(
    user_id: int,
    data: UserUpdate,
    principal: PrincipalDep,
    current_user: Annotated[User, Depends(require_permission("users.edit", "users.assign_role"))],
    db: DbSession,
) -> ApiResponse[UserOut]:
    return ApiResponse(
        data=await service.update_user_out(db, user_id, data, current_user, principal.permissions)
    )


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: Annotated[User, Depends(require_permission("users.delete"))],
    db: DbSession,
) -> ApiResponse[None]:
    await service.delete_user_by_id(db, user_id, current_user)
    return ApiResponse()


@router.put("/{user_id}/reset-password")
async def reset_password(
    user_id: int,
    data: ResetPasswordRequest,
    current_user: Annotated[User, Depends(require_permission("users.edit"))],
    db: DbSession,
) -> ApiResponse[None]:
    await service.reset_user_password(db, user_id, data, current_user)
    return ApiResponse()
