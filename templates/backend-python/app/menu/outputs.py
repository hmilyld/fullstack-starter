"""菜单展示的输出 schema。

菜单展示（分组、路由、图标、顺序、可见性）与权限授权分离：
``permissions`` 是授权唯一来源，这里只描述展示结构。
"""

from pydantic import BaseModel


class MenuOperationOut(BaseModel):
    code: str
    name: str


class MenuItemOut(BaseModel):
    permissionCode: str
    name: str
    groupId: str
    route: str
    icon: str
    sortOrder: int
    isSystem: bool
    hidden: bool
    operations: list[MenuOperationOut]


class MenuGroupOut(BaseModel):
    id: str
    name: str
    sortOrder: int
    isSystem: bool
    items: list[MenuItemOut]


class MenuConfigOut(BaseModel):
    version: int
    groups: list[MenuGroupOut]


class NavigationItemOut(BaseModel):
    permissionCode: str
    name: str
    route: str
    icon: str
    sortOrder: int


class NavigationGroupOut(BaseModel):
    id: str
    name: str
    sortOrder: int
    items: list[NavigationItemOut]


class MenuGroupResult(BaseModel):
    id: str
    name: str
    sortOrder: int | None = None


class MenuItemResult(BaseModel):
    permissionCode: str


class MenuLayoutResult(BaseModel):
    version: int


class MenuCatalogSyncResult(BaseModel):
    groups: list[str]
    items: list[str]
