// ============================================================
// 统一 API 类型定义
// ============================================================

/** 统一响应格式 */
export type ApiResponse<T = unknown> = {
  code: number
  message: string
  data: T
}

/** 分页数据 */
export type PaginatedData<T> = {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// ============================================================
// 实体类型
// ============================================================

export type User = {
  id: string
  username: string
  name: string
  email: string
  roleId: string
  avatar: string
}

export type Role = {
  id: string
  name: string
  description: string
  permissions: string[]
  isPreset: boolean
}

export type Permission = {
  code: string
  name: string
  type: "menu" | "operation"
  parent?: string
}

export type SystemConfig = {
  siteName: string
  siteDescription: string
  keywords: string
  maintenanceEnabled: boolean
  maintenanceMessage: string
  openRegistration: boolean
  manualReview: boolean
  defaultRoleId: string
  welcomeMessage: string
}

export type DashboardStats = {
  totalUsers: number
  activeNow: number
  revenue: string
  growth: string
}

export type ActivityItem = {
  user: string
  action: string
  time: string
}

export type AuthUser = {
  id: string
  name: string
  email: string
  avatar: string
  role: string
}

export type LoginResponse = {
  token: string
  user: AuthUser
}
