from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import crud
from app.core.models import User
from app.core.schemas import ApiResponse, PermissionCreate, PermissionUpdate
from app.database import get_db
from app.deps import require_permission

router = APIRouter(prefix="/permissions", tags=["权限"])


@router.get("")
async def get_permissions(
    type: str | None = None,
    parent: str | None = None,
    current_user: User = Depends(require_permission("permissions")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    permissions = await crud.get_permissions(db, type, parent)
    return ApiResponse(data=permissions)


@router.post("")
async def create_permission(
    data: PermissionCreate,
    current_user: User = Depends(require_permission("permissions.create")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    if await crud.get_permission_by_code(db, data.code):
        return ApiResponse(code=-1, message="权限编码已存在")
    result = await crud.create_permission(db, code=data.code, name=data.name, type=data.type, parent=data.parent)
    return ApiResponse(data=result)


@router.post("/sync")
async def sync_permissions_route(
    current_user: User = Depends(require_permission("permissions.create")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    result = await crud.sync_permissions(db)
    return ApiResponse(data=result, message="权限同步完成")


@router.put("/{code}")
async def update_permission(
    code: str,
    data: PermissionUpdate,
    current_user: User = Depends(require_permission("permissions.edit")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    permission = await crud.get_permission_by_code(db, code)
    if permission is None:
        return ApiResponse(code=-1, message="权限不存在")
    result = await crud.update_permission(db, permission, name=data.name, parent=data.parent)
    return ApiResponse(data=result)


@router.delete("/{code}")
async def delete_permission(
    code: str,
    current_user: User = Depends(require_permission("permissions.delete")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    permission = await crud.get_permission_by_code(db, code)
    if permission is None:
        return ApiResponse(code=-1, message="权限不存在")
    await crud.delete_permission(db, permission)
    return ApiResponse()
