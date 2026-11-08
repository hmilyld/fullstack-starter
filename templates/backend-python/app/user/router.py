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
async def update_me(data: UpdateMeRequest, current_user: CurrentUser, db: DbSession) -> ApiResponse:
    updated = await service.update_me(db, data, current_user)
    return ApiResponse(data=UserOut.from_orm_model(updated).model_dump())


@router.put("/me/password")
async def change_password(
    data: ChangePasswordRequest, current_user: CurrentUser, db: DbSession
) -> ApiResponse:
    await service.change_password(db, data, current_user)
    return ApiResponse()


@router.post("/batch-role")
async def batch_update_role(
    data: BatchRoleUpdateRequest,
    current_user: Annotated[User, Depends(require_permission("users.edit", "users.assign_role"))],
    db: DbSession,
) -> ApiResponse:
    applied = await service.batch_update_role(db, data, current_user)
    return ApiResponse(data={"applied": applied})


# ============================================================
# 列表与创建
# ============================================================


@router.get("")
async def get_users(
    current_user: Annotated[User, Depends(require_permission("users"))],
    db: DbSession,
    pagination: PaginationDep,
    search: str = "",
) -> ApiResponse:
    users, total = await service.list_users(db, search, pagination.page, pagination.page_size)
    return ApiResponse(
        data=PaginatedData(
            list=[UserOut.from_orm_model(u).model_dump() for u in users],
            total=total,
            page=pagination.page,
            pageSize=pagination.page_size,
        ).model_dump()
    )


@router.post("")
async def create_user(
    data: UserCreate,
    principal: PrincipalDep,
    current_user: Annotated[User, Depends(require_permission("users.create"))],
    db: DbSession,
) -> ApiResponse:
    user = await service.create_user(db, data, principal.permissions)
    return ApiResponse(data=UserOut.from_orm_model(user).model_dump())


# ============================================================
# 带 ID 参数的路由（必须在固定路径之后）
# ============================================================


@router.get("/{user_id}")
async def get_user(
    user_id: int,
    current_user: Annotated[User, Depends(require_permission("users"))],
    db: DbSession,
) -> ApiResponse:
    user = await service.get_user(db, user_id)
    return ApiResponse(data=UserOut.from_orm_model(user).model_dump())


@router.put("/{user_id}")
async def update_user(
    user_id: int,
    data: UserUpdate,
    principal: PrincipalDep,
    current_user: Annotated[User, Depends(require_permission("users.edit", "users.assign_role"))],
    db: DbSession,
) -> ApiResponse:
    updated = await service.update_user(db, user_id, data, current_user, principal.permissions)
    return ApiResponse(data=UserOut.from_orm_model(updated).model_dump())


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: Annotated[User, Depends(require_permission("users.delete"))],
    db: DbSession,
) -> ApiResponse:
    await service.delete_user(db, user_id, current_user)
    return ApiResponse()


@router.put("/{user_id}/reset-password")
async def reset_password(
    user_id: int,
    data: ResetPasswordRequest,
    current_user: Annotated[User, Depends(require_permission("users.edit"))],
    db: DbSession,
) -> ApiResponse:
    await service.reset_password(db, user_id, data, current_user)
    return ApiResponse()
