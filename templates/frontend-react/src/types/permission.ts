export type PermissionType = "menu" | "operation"

export type Permission = {
  code: string
  name: string
  type: PermissionType
  /** 操作权限所属的菜单 code */
  parent?: string
}
