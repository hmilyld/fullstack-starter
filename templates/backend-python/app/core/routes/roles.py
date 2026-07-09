import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import crud
from app.core.models import User
from app.core.schemas import ApiResponse, PaginatedData, RoleCreate, RoleUpdate
from app.database import get_db
from app.deps import require_permission

router = APIRouter(prefix="/roles", tags=["角色"])


@router.get("")
async def get_roles(
    search: str = "",
    page: int = 1,
    pageSize: int = 10,
    current_user: User = Depends(require_permission("roles")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    roles, total = await crud.get_roles(db, search, page, pageSize)
    return ApiResponse(data=PaginatedData(list=roles, total=total, page=page, pageSize=pageSize).model_dump())


@router.post("")
async def create_role(
    data: RoleCreate,
    current_user: User = Depends(require_permission("roles.create")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    role_id = str(uuid.uuid4())[:8]
    result = await crud.create_role(
        db, role_id=role_id, name=data.name, description=data.description, permissions=data.permissions
    )
    return ApiResponse(data=result)


@router.put("/{role_id}")
async def update_role(
    role_id: str,
    data: RoleUpdate,
    current_user: User = Depends(require_permission("roles.edit")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    role = await crud.get_role_by_id(db, role_id)
    if role is None:
        return ApiResponse(code=-1, message="角色不存在")
    result = await crud.update_role(
        db, role, name=data.name, description=data.description, permissions=data.permissions
    )
    return ApiResponse(data=result)


@router.delete("/{role_id}")
async def delete_role(
    role_id: str,
    current_user: User = Depends(require_permission("roles.delete")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    role = await crud.get_role_by_id(db, role_id)
    if role is None:
        return ApiResponse(code=-1, message="角色不存在")
    if role.is_preset:
        return ApiResponse(code=-1, message="预设角色不可删除")
    await crud.delete_role(db, role)
    return ApiResponse()
