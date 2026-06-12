import type {
  PaginatedData,
  User,
  Role,
  Permission,
  SystemConfig,
  DashboardStats,
  ActivityItem,
  LoginResponse,
} from "@/types/api"
import { apiClient } from "@/lib/api-client"

// ============================================================
// Auth API
// ============================================================

export async function login(account: string, password: string) {
  return apiClient.post<LoginResponse>("/auth/login", { account, password })
}

export async function register(data: { username: string; email: string; password: string }) {
  return apiClient.post<LoginResponse>("/auth/register", data)
}

export async function logout() {
  return apiClient.post("/auth/logout")
}

// ============================================================
// Dashboard API
// ============================================================

export async function getDashboardStats() {
  return apiClient.get<DashboardStats>("/dashboard/stats")
}

export async function getDashboardActivity() {
  return apiClient.get<ActivityItem[]>("/dashboard/activity")
}

// ============================================================
// Users API
// ============================================================

export async function getUsers(params?: {
  search?: string
  page?: number
  pageSize?: number
}) {
  return apiClient.get<PaginatedData<User>>("/users", params)
}

export async function getUser(id: string) {
  return apiClient.get<User>(`/users/${id}`)
}

export async function createUser(data: Omit<User, "id" | "avatar">) {
  return apiClient.post<User>("/users", data)
}

export async function updateUser(id: string, data: Partial<Omit<User, "id">>) {
  return apiClient.put<User>(`/users/${id}`, data)
}

export async function deleteUser(id: string) {
  return apiClient.delete(`/users/${id}`)
}

export async function resetPassword(id: string, newPassword: string) {
  return apiClient.put(`/users/${id}/reset-password`, { newPassword })
}

export async function batchUpdateRole(userIds: number[], roleId: string) {
  return apiClient.post("/users/batch-role", { userIds, roleId })
}

export async function updateMe(data: { name: string; email: string }) {
  return apiClient.put<User>("/users/me", data)
}

export async function changePassword(data: {
  currentPassword: string
  newPassword: string
}) {
  return apiClient.put("/users/me/password", data)
}

// ============================================================
// Roles API
// ============================================================

export async function getRoles(params?: {
  search?: string
  page?: number
  pageSize?: number
}) {
  return apiClient.get<PaginatedData<Role>>("/roles", params)
}

export async function createRole(data: Omit<Role, "id" | "isPreset">) {
  return apiClient.post<Role>("/roles", data)
}

export async function updateRole(
  id: string,
  data: Partial<Omit<Role, "id" | "isPreset">>
) {
  return apiClient.put<Role>(`/roles/${id}`, data)
}

export async function deleteRole(id: string) {
  return apiClient.delete(`/roles/${id}`)
}

// ============================================================
// Permissions API
// ============================================================

export async function getPermissions(params?: {
  type?: "menu" | "operation"
  parent?: string
}) {
  return apiClient.get<Permission[]>("/permissions", params)
}

export async function createPermission(data: Permission) {
  return apiClient.post<Permission>("/permissions", data)
}

export async function updatePermission(
  code: string,
  data: Partial<Pick<Permission, "name" | "parent">>
) {
  return apiClient.put<Permission>(`/permissions/${code}`, data)
}

export async function deletePermission(code: string) {
  return apiClient.delete(`/permissions/${code}`)
}

// ============================================================
// System Config API
// ============================================================

export type PublicConfig = {
  siteName: string
  siteDescription: string
  maintenanceEnabled: boolean
  maintenanceMessage: string
  openRegistration: boolean
  manualReview: boolean
}

export async function getPublicConfig() {
  return apiClient.get<PublicConfig>("/system/public-config")
}

export async function getSystemConfig() {
  return apiClient.get<SystemConfig>("/system/config")
}

export async function updateSystemConfig(data: Partial<SystemConfig>) {
  return apiClient.put<SystemConfig>("/system/config", data)
}
