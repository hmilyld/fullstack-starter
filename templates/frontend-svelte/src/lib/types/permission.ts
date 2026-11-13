export type PermissionType = "menu" | "operation"

export type Permission = {
  code: string
  name: string
  type: PermissionType
  /** 操作权限所属的菜单 code */
  parent?: string
}

/** 权限列表查询参数 */
export type PermissionQuery = {
  type?: PermissionType
  /** 只取某个菜单下的操作权限 */
  parent?: string
}

/** 同步权限目录后返回的变化摘要 */
export type PermissionSyncResult = {
  added: string[]
  updated: string[]
  granted: string[]
}
