// ============================================================
// 权限类型定义
// ============================================================

export type PermissionType = "menu" | "operation"

export type Permission = {
  code: string
  name: string
  type: PermissionType
  /** 操作权限所属的菜单 code */
  parent?: string
}

// ============================================================
// 角色类型定义
// ============================================================

export type Role = {
  id: string
  name: string
  description: string
  permissions: string[]
  isPreset: boolean
}
