from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_permission
from app.core.pagination import Pagination, pagination_params
from app.core.schemas import ApiResponse, PaginatedData
from app.role import service
from app.role.schemas import RoleCreate, RoleOut, RoleUpdate
from app.user.models import User

router = APIRouter(prefix="/roles", tags=["角色"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
PaginationDep = Annotated[Pagination, Depends(pagination_params)]


@router.get("")
async def get_roles(
    current_user: Annotated[User, Depends(require_permission("roles"))],
    db: DbSession,
    pagination: PaginationDep,
    search: str = "",
) -> ApiResponse[PaginatedData[RoleOut]]:
    roles, total = await service.list_roles(db, search, pagination.page, pagination.page_size)
    return ApiResponse(
        data=PaginatedData[RoleOut](
            list=roles,
            total=total,
            page=pagination.page,
            pageSize=pagination.page_size,
        )
    )


@router.post("")
async def create_role(
    data: RoleCreate,
    current_user: Annotated[User, Depends(require_permission("roles.create"))],
    db: DbSession,
) -> ApiResponse[RoleOut]:
    return ApiResponse(data=await service.create_role(db, data))


@router.put("/{role_id}")
async def update_role(
    role_id: str,
    data: RoleUpdate,
    current_user: Annotated[User, Depends(require_permission("roles.edit"))],
    db: DbSession,
) -> ApiResponse[RoleOut]:
    return ApiResponse(data=await service.update_role(db, role_id, data))


@router.delete("/{role_id}")
async def delete_role(
    role_id: str,
    current_user: Annotated[User, Depends(require_permission("roles.delete"))],
    db: DbSession,
) -> ApiResponse[None]:
    await service.delete_role(db, role_id)
    return ApiResponse()
