export type ApiResponse<T = unknown> = {
  code: number
  message: string
  data: T
}

export type PaginatedData<T> = {
  list: T[]
  total: number
  page: number
  pageSize: number
}

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
  type: 'menu' | 'operation'
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
  smtpEnabled: boolean
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  smtpPassword: string
  smtpFromName: string
  smtpFromEmail: string
  smtpUseSsl: boolean
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
  permissions: string[]
}

export type LoginResponse = {
  token: string
  user: AuthUser
}

export type AiModel = {
  id: string
  alias: string
  modelName: string
  apiUrl: string
  apiKey: string
  description: string
  isDefault: boolean
}

export type AiModelPreset = {
  id: string
  group: string
  alias: string
  modelName: string
  apiUrl: string
  description: string
  isActive: boolean
  sortOrder: number
}
