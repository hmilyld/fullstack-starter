export type MenuOperation = {
  code: string
  name: string
}

export type MenuItem = {
  permissionCode: string
  name: string
  groupId: string
  route: string
  icon: string
  sortOrder: number
  isSystem: boolean
  hidden: boolean
  operations: MenuOperation[]
}

export type MenuGroup = {
  id: string
  name: string
  sortOrder: number
  isSystem: boolean
  items: MenuItem[]
}

export type MenuConfig = {
  version: number
  groups: MenuGroup[]
}

export type NavigationItem = {
  permissionCode: string
  name: string
  route: string
  icon: string
  sortOrder: number
}

export type NavigationGroup = {
  id: string
  name: string
  sortOrder: number
  items: NavigationItem[]
}

/** 新建菜单项请求体 */
export type MenuItemPayload = Pick<
  MenuItem,
  "permissionCode" | "name" | "groupId" | "route" | "icon"
> & {
  hidden?: boolean
}

/** 编辑菜单项请求体（不含 permissionCode，它在路径里；字段均可选） */
export type MenuItemPatch = Partial<Omit<MenuItemPayload, "permissionCode">>

/** 原子保存菜单布局请求体 */
export type MenuLayoutPayload = {
  version: number
  groups: Array<{
    id: string
    sortOrder: number
    items: Array<Pick<MenuItem, "permissionCode" | "sortOrder">>
  }>
}

/** 保存布局后返回的新版本号，用于乐观锁 */
export type MenuLayoutResult = {
  version: number
}
