from typing import Annotated

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
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(require_permission("permissions")),
) -> ApiResponse:
    permissions = await crud.get_permissions(db, type, parent)
    return ApiResponse(data=permissions)


@router.post("")
async def create_permission(
    data: PermissionCreate,
    current_user: User = Depends(require_permission("permissions.create")),
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> ApiResponse:
    if await crud.get_permission_by_code(db, data.code):
        return ApiResponse(code=-1, message="权限编码已存在")
    result = await crud.create_permission(db, code=data.code, name=data.name, type=data.type, parent=data.parent)
    return ApiResponse(data=result)


@router.put("/{code}")
async def update_permission(
    code: str,
    data: PermissionUpdate,
    current_user: User = Depends(require_permission("permissions.edit")),
    db: Annotated[AsyncSession, Depends(get_db)] = None,
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
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> ApiResponse:
    permission = await crud.get_permission_by_code(db, code)
    if permission is None:
        return ApiResponse(code=-1, message="权限不存在")
    await crud.delete_permission(db, permission)
    return ApiResponse()
