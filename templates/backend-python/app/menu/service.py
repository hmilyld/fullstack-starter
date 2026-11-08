"""菜单领域的业务逻辑。

菜单展示（``menu_groups`` / ``menu_items``）与权限授权（``permissions``）分离：
``permissions`` 是授权唯一来源，菜单只负责分组、路由、图标、顺序与侧边栏可见性。
"""

import uuid

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.app_state import get_app_state
from app.core.exceptions import ConflictError, InvalidOperationError, NotFoundError
from app.core.menu_catalog import MENU_GROUPS, MENU_ITEMS
from app.menu.models import MenuGroup, MenuItem
from app.menu.schemas import MenuGroupCreate, MenuItemCreate, MenuItemUpdate, MenuLayoutUpdate
from app.permission.models import Permission
from app.role.models import RolePermission

MENU_TYPE = "menu"
OPERATION_TYPE = "operation"
ADMIN_ROLE_ID = "admin"


async def sync_menu_catalog(db: AsyncSession) -> dict:
    """补齐内置分组与菜单，不覆盖已有的顺序调整。"""
    existing_groups = {
        group.id for group in (await db.execute(select(MenuGroup))).scalars().all()
    }
    existing_items = {
        item.permission_code for item in (await db.execute(select(MenuItem))).scalars().all()
    }

    added_groups: list[str] = []
    added_items: list[str] = []
    for group in MENU_GROUPS:
        if group["id"] not in existing_groups:
            db.add(MenuGroup(**group))
            added_groups.append(group["id"])

    for item in MENU_ITEMS:
        if item["permission_code"] not in existing_items:
            db.add(MenuItem(**item))
            added_items.append(item["permission_code"])

    await db.flush()
    return {"groups": added_groups, "items": added_items}


async def get_menu_config(db: AsyncSession) -> dict:
    state = await get_app_state(db)
    groups = (
        await db.execute(select(MenuGroup).order_by(MenuGroup.sort_order, MenuGroup.id))
    ).scalars().all()
    rows = (
        await db.execute(
            select(MenuItem, Permission.name)
            .join(Permission, Permission.code == MenuItem.permission_code)
            .order_by(MenuItem.sort_order, MenuItem.permission_code)
        )
    ).all()
    operations = (
        await db.execute(
            select(Permission).where(Permission.type == OPERATION_TYPE).order_by(Permission.code)
        )
    ).scalars().all()

    operations_by_parent: dict[str, list[dict]] = {}
    for operation in operations:
        if not operation.parent:
            continue
        operations_by_parent.setdefault(operation.parent, []).append(
            {"code": operation.code, "name": operation.name}
        )

    items_by_group: dict[str, list[dict]] = {}
    for item, name in rows:
        items_by_group.setdefault(item.group_id, []).append(
            {
                "permissionCode": item.permission_code,
                "name": name,
                "groupId": item.group_id,
                "route": item.route,
                "icon": item.icon,
                "sortOrder": item.sort_order,
                "isSystem": bool(item.is_system),
                "hidden": bool(item.hidden),
                "operations": operations_by_parent.get(item.permission_code, []),
            }
        )

    return {
        "version": state.menu_layout_version,
        "groups": [
            {
                "id": group.id,
                "name": group.name,
                "sortOrder": group.sort_order,
                "isSystem": bool(group.is_system),
                "items": items_by_group.get(group.id, []),
            }
            for group in groups
        ],
    }


async def get_navigation(db: AsyncSession, permissions: set[str] | frozenset[str]) -> list[dict]:
    """按权限过滤的侧边栏。``hidden`` 只影响展示，不撤销授权。"""
    rows = (
        await db.execute(
            select(MenuGroup, MenuItem, Permission.name)
            .join(MenuItem, MenuItem.group_id == MenuGroup.id)
            .join(Permission, Permission.code == MenuItem.permission_code)
            .where(Permission.type == MENU_TYPE)
            .where(MenuItem.hidden.is_(False))
            .order_by(
                MenuGroup.sort_order,
                MenuGroup.id,
                MenuItem.sort_order,
                MenuItem.permission_code,
            )
        )
    ).all()

    groups: dict[str, dict] = {}
    for group, item, name in rows:
        if item.permission_code not in permissions:
            continue
        entry = groups.setdefault(
            group.id,
            {
                "id": group.id,
                "name": group.name,
                "sortOrder": group.sort_order,
                "items": [],
            },
        )
        entry["items"].append(
            {
                "permissionCode": item.permission_code,
                "name": name,
                "route": item.route,
                "icon": item.icon,
                "sortOrder": item.sort_order,
            }
        )
    return list(groups.values())


async def get_group(db: AsyncSession, group_id: str) -> MenuGroup:
    group = await db.get(MenuGroup, group_id)
    if group is None:
        raise NotFoundError("菜单分组不存在")
    return group


async def get_item(db: AsyncSession, permission_code: str) -> MenuItem:
    item = await db.get(MenuItem, permission_code)
    if item is None:
        raise NotFoundError("菜单不存在")
    return item


async def create_group(db: AsyncSession, data: MenuGroupCreate) -> dict:
    max_order = (await db.execute(select(func.max(MenuGroup.sort_order)))).scalar() or 0
    group = MenuGroup(
        id=uuid.uuid4().hex[:12],
        name=data.name,
        sort_order=max_order + 1,
        is_system=False,
    )
    db.add(group)
    await db.flush()
    return {"id": group.id, "name": group.name, "sortOrder": group.sort_order}


async def update_group(db: AsyncSession, group_id: str, name: str) -> dict:
    group = await get_group(db, group_id)
    group.name = name
    await db.flush()
    return {"id": group.id, "name": group.name}


async def delete_group(db: AsyncSession, group_id: str) -> None:
    group = await get_group(db, group_id)
    if group.is_system:
        raise InvalidOperationError("内置分组不能删除")
    count = (
        await db.execute(
            select(func.count()).select_from(MenuItem).where(MenuItem.group_id == group.id)
        )
    ).scalar() or 0
    if count:
        raise InvalidOperationError("请先移动或删除该分组下的菜单")
    await db.delete(group)
    await db.flush()


async def create_item(db: AsyncSession, data: MenuItemCreate) -> dict:
    if await db.get(MenuGroup, data.group_id) is None:
        raise NotFoundError("菜单分组不存在")
    if await db.get(Permission, data.permission_code) is not None:
        raise ConflictError("权限编码已存在")

    max_order = (
        await db.execute(
            select(func.max(MenuItem.sort_order)).where(MenuItem.group_id == data.group_id)
        )
    ).scalar() or 0

    db.add(Permission(code=data.permission_code, name=data.name, type=MENU_TYPE))
    db.add(RolePermission(role_id=ADMIN_ROLE_ID, permission_code=data.permission_code))
    item = MenuItem(
        permission_code=data.permission_code,
        group_id=data.group_id,
        route=data.route,
        icon=data.icon or "circle",
        sort_order=max_order + 1,
        is_system=False,
        hidden=data.hidden,
    )
    db.add(item)
    await db.flush()
    return {"permissionCode": item.permission_code}


async def update_item(
    db: AsyncSession, permission_code: str, data: MenuItemUpdate
) -> None:
    item = await get_item(db, permission_code)

    if data.group_id is not None:
        if await db.get(MenuGroup, data.group_id) is None:
            raise NotFoundError("菜单分组不存在")
        if item.group_id != data.group_id:
            max_order = (
                await db.execute(
                    select(func.max(MenuItem.sort_order)).where(
                        MenuItem.group_id == data.group_id
                    )
                )
            ).scalar() or 0
            item.sort_order = max_order + 1
        item.group_id = data.group_id
    if data.route is not None:
        item.route = data.route
    if data.icon is not None:
        item.icon = data.icon or "circle"
    if data.hidden is not None:
        item.hidden = data.hidden
    if data.name is not None:
        permission = await db.get(Permission, permission_code)
        if permission is not None:
            permission.name = data.name
    await db.flush()


async def delete_item(db: AsyncSession, permission_code: str) -> None:
    item = await get_item(db, permission_code)
    if item.is_system:
        raise InvalidOperationError("内置菜单不能删除")

    children = (
        await db.execute(select(Permission).where(Permission.parent == permission_code))
    ).scalars().all()
    codes = [permission_code, *(child.code for child in children)]

    await db.execute(delete(RolePermission).where(RolePermission.permission_code.in_(codes)))
    for child in children:
        await db.delete(child)
    permission = await db.get(Permission, permission_code)
    if permission is not None:
        await db.delete(permission)
    await db.delete(item)
    await db.flush()


async def save_layout(db: AsyncSession, data: MenuLayoutUpdate) -> int:
    """原子保存分组与菜单顺序，用 ``menu_layout_version`` 做乐观锁。"""
    state = await get_app_state(db)
    if data.version != state.menu_layout_version:
        raise ConflictError("菜单顺序已被其他管理员修改，请刷新后重试")

    items = (await db.execute(select(MenuItem))).scalars().all()
    item_map = {item.permission_code: item for item in items}
    group_map = {
        group.id: group for group in (await db.execute(select(MenuGroup))).scalars().all()
    }

    seen: set[str] = set()
    group_updates: list[tuple[MenuGroup, int]] = []
    item_updates: list[tuple[MenuItem, str, int]] = []

    for group_data in data.groups:
        group = group_map.get(group_data.id)
        if group is None:
            raise NotFoundError("菜单分组不存在")
        group_updates.append((group, group_data.sort_order))
        for item_data in group_data.items:
            code = item_data.permission_code
            if code in seen or code not in item_map:
                raise InvalidOperationError("菜单布局包含重复或无效菜单")
            seen.add(code)
            item_updates.append((item_map[code], group_data.id, item_data.sort_order))

    if seen != set(item_map):
        raise InvalidOperationError("菜单布局必须包含全部菜单")

    for group, sort_order in group_updates:
        group.sort_order = sort_order
    for item, group_id, sort_order in item_updates:
        item.group_id = group_id
        item.sort_order = sort_order

    state.menu_layout_version += 1
    await db.flush()
    return state.menu_layout_version
