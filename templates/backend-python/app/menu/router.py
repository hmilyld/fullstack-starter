from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user_with_permissions, require_permission
from app.core.schemas import ApiResponse
from app.menu import crud
from app.menu.models import MenuGroup, MenuItem
from app.menu.schemas import (
    MenuGroupCreate,
    MenuGroupUpdate,
    MenuItemCreate,
    MenuItemUpdate,
    MenuLayoutUpdate,
)

router = APIRouter(prefix="/menus", tags=["菜单"])


@router.get("/navigation")
async def navigation(
    user_with_permissions: Annotated[
        tuple[object, list[str]], Depends(get_current_user_with_permissions)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ApiResponse:
    _, permissions = user_with_permissions
    return ApiResponse(data=await crud.get_navigation(db, permissions))


@router.get("")
async def get_menu_config(
    current_user=Depends(require_permission("menus")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    return ApiResponse(data=await crud.get_menu_config(db))


@router.post("/groups")
async def create_group(
    data: MenuGroupCreate,
    current_user=Depends(require_permission("menus.create")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    group = await crud.create_group(db, data.name)
    return ApiResponse(data={"id": group.id, "name": group.name, "sortOrder": group.sort_order})


@router.put("/groups/{group_id}")
async def update_group(
    group_id: str,
    data: MenuGroupUpdate,
    current_user=Depends(require_permission("menus.edit")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    group = await db.get(MenuGroup, group_id)
    if group is None:
        return ApiResponse(code=-1, message="菜单分组不存在")
    await crud.update_group(db, group, data.name)
    return ApiResponse(data={"id": group.id, "name": group.name})


@router.delete("/groups/{group_id}")
async def delete_group(
    group_id: str,
    current_user=Depends(require_permission("menus.delete")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    group = await db.get(MenuGroup, group_id)
    if group is None:
        return ApiResponse(code=-1, message="菜单分组不存在")
    if group.is_system:
        return ApiResponse(code=-1, message="内置分组不能删除")
    try:
        await crud.delete_group(db, group)
    except ValueError as exc:
        return ApiResponse(code=-1, message=str(exc))
    return ApiResponse()


@router.post("/items")
async def create_item(
    data: MenuItemCreate,
    current_user=Depends(require_permission("menus.create")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    try:
        item = await crud.create_item(
            db,
            permission_code=data.permission_code,
            name=data.name,
            group_id=data.group_id,
            route=data.route,
            icon=data.icon,
        )
    except ValueError as exc:
        return ApiResponse(code=-1, message=str(exc))
    return ApiResponse(data={"permissionCode": item.permission_code})


@router.put("/items/{permission_code}")
async def update_item(
    permission_code: str,
    data: MenuItemUpdate,
    current_user=Depends(require_permission("menus.edit")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    item = await db.get(MenuItem, permission_code)
    if item is None:
        return ApiResponse(code=-1, message="菜单不存在")
    try:
        await crud.update_item(
            db,
            item,
            name=data.name,
            group_id=data.group_id,
            route=data.route,
            icon=data.icon,
        )
    except ValueError as exc:
        return ApiResponse(code=-1, message=str(exc))
    return ApiResponse()


@router.delete("/items/{permission_code}")
async def delete_item(
    permission_code: str,
    current_user=Depends(require_permission("menus.delete")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    item = await db.get(MenuItem, permission_code)
    if item is None:
        return ApiResponse(code=-1, message="菜单不存在")
    try:
        await crud.delete_item(db, item)
    except ValueError as exc:
        return ApiResponse(code=-1, message=str(exc))
    return ApiResponse()


@router.put("/layout")
async def save_layout(
    data: MenuLayoutUpdate,
    current_user=Depends(require_permission("menus.reorder")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    try:
        version = await crud.save_layout(
            db,
            version=data.version,
            groups=[group.model_dump() for group in data.groups],
        )
    except ValueError as exc:
        return ApiResponse(code=-1, message=str(exc))
    return ApiResponse(data={"version": version})
