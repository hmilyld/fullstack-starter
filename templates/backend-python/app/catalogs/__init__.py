"""目录模块：权限码与内置菜单的唯一来源。

这两个模块是纯数据，不依赖数据库或框架；
启动时的同步任务据此补齐数据库，因此新增权限/菜单只需改这里。
"""

from app.catalogs.menus import MENU_GROUPS, MENU_ITEMS
from app.catalogs.permissions import ALL_PERMISSIONS, MENU_PERMISSIONS, OPERATION_PERMISSIONS

__all__ = [
    "ALL_PERMISSIONS",
    "MENU_GROUPS",
    "MENU_ITEMS",
    "MENU_PERMISSIONS",
    "OPERATION_PERMISSIONS",
]
