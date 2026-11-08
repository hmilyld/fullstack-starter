from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_permission
from app.core.schemas import ApiResponse
from app.permission import service
from app.permission.schemas import PermissionCreate, PermissionUpdate
from app.user.models import User

router = APIRouter(prefix="/permissions", tags=["权限"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("")
async def get_permissions(
    current_user: Annotated[User, Depends(require_permission("permissions"))],
    db: DbSession,
    type: str | None = None,
    parent: str | None = None,
) -> ApiResponse:
    return ApiResponse(data=await service.list_permissions(db, type, parent))


@router.post("")
async def create_permission(
    data: PermissionCreate,
    current_user: Annotated[User, Depends(require_permission("permissions.create"))],
    db: DbSession,
) -> ApiResponse:
    return ApiResponse(data=await service.create_permission(db, data))


@router.post("/sync")
async def sync_permissions_route(
    current_user: Annotated[User, Depends(require_permission("permissions.create"))],
    db: DbSession,
) -> ApiResponse:
    return ApiResponse(data=await service.sync_catalog(db), message="权限同步完成")


@router.put("/{code}")
async def update_permission(
    code: str,
    data: PermissionUpdate,
    current_user: Annotated[User, Depends(require_permission("permissions.edit"))],
    db: DbSession,
) -> ApiResponse:
    return ApiResponse(data=await service.update_permission(db, code, data))


@router.delete("/{code}")
async def delete_permission(
    code: str,
    current_user: Annotated[User, Depends(require_permission("permissions.delete"))],
    db: DbSession,
) -> ApiResponse:
    await service.delete_permission(db, code)
    return ApiResponse()
