import uuid

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.app_state import get_app_state
from app.core.menu_catalog import MENU_GROUPS, MENU_ITEMS
from app.menu.models import MenuGroup, MenuItem
from app.permission.models import Permission
from app.role.models import RolePermission


async def sync_menu_catalog(db: AsyncSession) -> dict:
    existing_groups = {
        item.id: item for item in (await db.execute(select(MenuGroup))).scalars().all()
    }
    existing_items = {
        item.permission_code: item
        for item in (await db.execute(select(MenuItem))).scalars().all()
    }

    added_groups: list[str] = []
    added_items: list[str] = []
    for item in MENU_GROUPS:
        if item["id"] not in existing_groups:
            db.add(MenuGroup(**item))
            added_groups.append(item["id"])

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
                "isSystem": item.is_system,
            }
        )

    return {
        "version": state.menu_layout_version,
        "groups": [
            {
                "id": group.id,
                "name": group.name,
                "sortOrder": group.sort_order,
                "isSystem": group.is_system,
                "items": items_by_group.get(group.id, []),
            }
            for group in groups
        ],
    }


async def get_navigation(db: AsyncSession, permissions: list[str]) -> list[dict]:
    result = await db.execute(
        select(MenuGroup, MenuItem, Permission.name)
        .join(MenuItem, MenuItem.group_id == MenuGroup.id)
        .join(Permission, Permission.code == MenuItem.permission_code)
        .where(Permission.type == "menu")
        .order_by(MenuGroup.sort_order, MenuGroup.id, MenuItem.sort_order, MenuItem.permission_code)
    )
    rows = result.all()
    allowed = set(permissions)
    groups: dict[str, dict] = {}
    for group, item, name in rows:
        if item.permission_code not in allowed:
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


async def create_group(db: AsyncSession, name: str) -> MenuGroup:
    max_order = (await db.execute(select(func.max(MenuGroup.sort_order)))).scalar() or 0
    group = MenuGroup(
        id=uuid.uuid4().hex[:12],
        name=name,
        sort_order=max_order + 1,
        is_system=False,
    )
    db.add(group)
    await db.flush()
    return group


async def update_group(db: AsyncSession, group: MenuGroup, name: str) -> MenuGroup:
    group.name = name
    await db.flush()
    return group


async def delete_group(db: AsyncSession, group: MenuGroup) -> None:
    count = (
        await db.execute(select(func.count()).select_from(MenuItem).where(MenuItem.group_id == group.id))
    ).scalar()
    if count:
        raise ValueError("请先移动或删除该分组下的菜单")
    await db.delete(group)


async def create_item(
    db: AsyncSession,
    *,
    permission_code: str,
    name: str,
    group_id: str,
    route: str,
    icon: str,
) -> MenuItem:
    if await db.get(MenuGroup, group_id) is None:
        raise ValueError("菜单分组不存在")
    if await db.get(Permission, permission_code):
        raise ValueError("权限编码已存在")

    max_order = (
        await db.execute(select(func.max(MenuItem.sort_order)).where(MenuItem.group_id == group_id))
    ).scalar() or 0
    db.add(Permission(code=permission_code, name=name, type="menu"))
    db.add(RolePermission(role_id="admin", permission_code=permission_code))
    item = MenuItem(
        permission_code=permission_code,
        group_id=group_id,
        route=route,
        icon=icon or "circle",
        sort_order=max_order + 1,
        is_system=False,
    )
    db.add(item)
    await db.flush()
    return item


async def update_item(
    db: AsyncSession,
    item: MenuItem,
    *,
    name: str | None,
    group_id: str | None,
    route: str | None,
    icon: str | None,
) -> MenuItem:
    if group_id is not None:
        if await db.get(MenuGroup, group_id) is None:
            raise ValueError("菜单分组不存在")
        if item.group_id != group_id:
            max_order = (
                await db.execute(
                    select(func.max(MenuItem.sort_order)).where(MenuItem.group_id == group_id)
                )
            ).scalar() or 0
            item.sort_order = max_order + 1
        item.group_id = group_id
    if route is not None:
        item.route = route
    if icon is not None:
        item.icon = icon or "circle"
    if name is not None:
        permission = await db.get(Permission, item.permission_code)
        if permission is not None:
            permission.name = name
    await db.flush()
    return item


async def delete_item(db: AsyncSession, item: MenuItem) -> None:
    if item.is_system:
        raise ValueError("内置菜单不能删除")
    await db.execute(
        delete(RolePermission).where(RolePermission.permission_code == item.permission_code)
    )
    permission = await db.get(Permission, item.permission_code)
    if permission is not None:
        await db.delete(permission)
    await db.delete(item)


async def save_layout(
    db: AsyncSession,
    *,
    version: int,
    groups: list[dict],
) -> int:
    state = await get_app_state(db)
    if version != state.menu_layout_version:
        raise ValueError("菜单顺序已被其他管理员修改，请刷新后重试")

    items = (await db.execute(select(MenuItem))).scalars().all()
    item_map = {item.permission_code: item for item in items}
    seen: set[str] = set()
    group_ids = set((await db.execute(select(MenuGroup.id))).scalars().all())
    group_updates: list[tuple[MenuGroup, int]] = []
    item_updates: list[tuple[MenuItem, str, int]] = []

    for group_data in groups:
        group_id = group_data["id"]
        if group_id not in group_ids:
            raise ValueError("菜单分组不存在")
        group = await db.get(MenuGroup, group_id)
        group_updates.append((group, group_data["sort_order"]))
        for item_data in group_data["items"]:
            code = item_data["permission_code"]
            if code in seen or code not in item_map:
                raise ValueError("菜单布局包含重复或无效菜单")
            seen.add(code)
            item_updates.append((item_map[code], group_id, item_data["sort_order"]))

    if seen != set(item_map):
        raise ValueError("菜单布局必须包含全部菜单")

    for group, sort_order in group_updates:
        group.sort_order = sort_order
    for item, group_id, sort_order in item_updates:
        item.group_id = group_id
        item.sort_order = sort_order
    state.menu_layout_version += 1
    await db.flush()
    return state.menu_layout_version
