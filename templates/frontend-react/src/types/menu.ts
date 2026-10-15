export type MenuItem = {
  permissionCode: string
  name: string
  groupId: string
  route: string
  icon: string
  sortOrder: number
  isSystem: boolean
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
