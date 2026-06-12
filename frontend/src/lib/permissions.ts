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

// ============================================================
// 种子数据 — 菜单权限
// ============================================================

export const SEED_MENU_PERMISSIONS: Permission[] = [
  { code: "dashboard", name: "仪表盘", type: "menu" },
  { code: "users", name: "用户管理", type: "menu" },
  { code: "roles", name: "角色管理", type: "menu" },
  { code: "permissions", name: "权限管理", type: "menu" },
  { code: "settings", name: "系统设置", type: "menu" },
]

// ============================================================
// 种子数据 — 操作权限
// ============================================================

export const SEED_OPERATION_PERMISSIONS: Permission[] = [
  { code: "users.create", name: "新增用户", type: "operation", parent: "users" },
  { code: "users.edit", name: "编辑用户", type: "operation", parent: "users" },
  { code: "users.delete", name: "删除用户", type: "operation", parent: "users" },
  { code: "roles.create", name: "新增角色", type: "operation", parent: "roles" },
  { code: "roles.edit", name: "编辑角色", type: "operation", parent: "roles" },
  { code: "roles.delete", name: "删除角色", type: "operation", parent: "roles" },
  { code: "permissions.create", name: "新增权限", type: "operation", parent: "permissions" },
  { code: "permissions.edit", name: "编辑权限", type: "operation", parent: "permissions" },
  { code: "permissions.delete", name: "删除权限", type: "operation", parent: "permissions" },
]

// ============================================================
// 种子数据 — 预设角色
// ============================================================

const ALL_SEED_PERMISSIONS = [...SEED_MENU_PERMISSIONS, ...SEED_OPERATION_PERMISSIONS]
const ALL_SEED_PERMISSION_CODES = ALL_SEED_PERMISSIONS.map((p) => p.code)

export const SEED_PRESET_ROLES: Role[] = [
  {
    id: "admin",
    name: "管理员",
    description: "拥有系统所有权限",
    permissions: [...ALL_SEED_PERMISSION_CODES],
    isPreset: true,
  },
  {
    id: "user",
    name: "普通用户",
    description: "拥有基本的查看权限",
    permissions: ["dashboard", "users", "settings"],
    isPreset: true,
  },
]
