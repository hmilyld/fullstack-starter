from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import Principal, get_principal, require_permission
from app.core.schemas import ApiResponse
from app.menu import service
from app.menu.schemas import (
    MenuGroupCreate,
    MenuGroupUpdate,
    MenuItemCreate,
    MenuItemUpdate,
    MenuLayoutUpdate,
)
from app.user.models import User

router = APIRouter(prefix="/menus", tags=["菜单"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/navigation")
async def navigation(principal: Annotated[Principal, Depends(get_principal)], db: DbSession) -> ApiResponse:
    return ApiResponse(data=await service.get_navigation(db, principal.permissions.codes))


@router.get("")
async def get_menu_config(
    current_user: Annotated[User, Depends(require_permission("menus", "permissions"))],
    db: DbSession,
) -> ApiResponse:
    return ApiResponse(data=await service.get_menu_config(db))


@router.post("/groups")
async def create_group(
    data: MenuGroupCreate,
    current_user: Annotated[User, Depends(require_permission("menus.create"))],
    db: DbSession,
) -> ApiResponse:
    return ApiResponse(data=await service.create_group(db, data))


@router.put("/groups/{group_id}")
async def update_group(
    group_id: str,
    data: MenuGroupUpdate,
    current_user: Annotated[User, Depends(require_permission("menus.edit"))],
    db: DbSession,
) -> ApiResponse:
    return ApiResponse(data=await service.update_group(db, group_id, data.name))


@router.delete("/groups/{group_id}")
async def delete_group(
    group_id: str,
    current_user: Annotated[User, Depends(require_permission("menus.delete"))],
    db: DbSession,
) -> ApiResponse:
    await service.delete_group(db, group_id)
    return ApiResponse()


@router.post("/items")
async def create_item(
    data: MenuItemCreate,
    current_user: Annotated[User, Depends(require_permission("menus.create"))],
    db: DbSession,
) -> ApiResponse:
    return ApiResponse(data=await service.create_item(db, data))


@router.put("/items/{permission_code}")
async def update_item(
    permission_code: str,
    data: MenuItemUpdate,
    current_user: Annotated[User, Depends(require_permission("menus.edit"))],
    db: DbSession,
) -> ApiResponse:
    await service.update_item(db, permission_code, data)
    return ApiResponse()


@router.delete("/items/{permission_code}")
async def delete_item(
    permission_code: str,
    current_user: Annotated[User, Depends(require_permission("menus.delete"))],
    db: DbSession,
) -> ApiResponse:
    await service.delete_item(db, permission_code)
    return ApiResponse()


@router.put("/layout")
async def save_layout(
    data: MenuLayoutUpdate,
    current_user: Annotated[User, Depends(require_permission("menus.reorder"))],
    db: DbSession,
) -> ApiResponse:
    version = await service.save_layout(db, data)
    return ApiResponse(data={"version": version})
