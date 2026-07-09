import type {
  PaginatedData,
  User,
  Role,
  Permission,
  SystemConfig,
  DashboardStats,
  ActivityItem,
  LoginResponse,
  AiModel,
  AiModelPreset,
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
  return apiClient.get<PublicConfig>("/public/config")
}

export async function getSystemConfig() {
  return apiClient.get<SystemConfig>("/system/config")
}

export async function updateSystemConfig(data: Partial<SystemConfig>) {
  return apiClient.put<SystemConfig>("/system/config", data)
}

export async function testEmail(email: string) {
  return apiClient.post("/system/test-email", { email })
}

// ============================================================
// AI Models API
// ============================================================

export async function getAiModels(params?: {
  search?: string
  page?: number
  pageSize?: number
}) {
  return apiClient.get<PaginatedData<AiModel>>("/ai-models", params)
}

export async function getAiModel(id: string) {
  return apiClient.get<AiModel>(`/ai-models/${id}`)
}

export async function createAiModel(data: Omit<AiModel, "id">) {
  return apiClient.post<AiModel>("/ai-models", data)
}

export async function updateAiModel(id: string, data: Partial<Omit<AiModel, "id">>) {
  return apiClient.put<AiModel>(`/ai-models/${id}`, data)
}

export async function deleteAiModel(id: string) {
  return apiClient.delete(`/ai-models/${id}`)
}

export async function getDefaultAiModel() {
  return apiClient.get<AiModel>("/ai-models/default")
}

export async function getAiModelByAlias(alias: string) {
  return apiClient.get<AiModel>(`/ai-models/by-alias/${alias}`)
}

export async function testAiModel(data: {
  apiUrl: string
  apiKey: string
  modelName: string
}) {
  return apiClient.post<{
    success: boolean
    message: string
    responseTime: number | null
    model: string | null
  }>("/ai-models/test", data)
}

// ============================================================
// AI Model Presets API
// ============================================================

export async function getAiModelPresets(params?: {
  search?: string
  group?: string
  isActive?: boolean
}) {
  return apiClient.get<AiModelPreset[]>("/ai-models/presets", params)
}

export async function getAiModelPresetGroups() {
  return apiClient.get<string[]>("/ai-models/presets/groups")
}

export async function getActiveAiModelPresets() {
  return apiClient.get<AiModelPreset[]>("/ai-models/presets/active")
}

export async function getAiModelPreset(id: string) {
  return apiClient.get<AiModelPreset>(`/ai-models/presets/${id}`)
}

export async function createAiModelPreset(data: Omit<AiModelPreset, "id">) {
  return apiClient.post<AiModelPreset>("/ai-models/presets", data)
}

export async function updateAiModelPreset(id: string, data: Partial<Omit<AiModelPreset, "id">>) {
  return apiClient.put<AiModelPreset>(`/ai-models/presets/${id}`, data)
}

export async function deleteAiModelPreset(id: string) {
  return apiClient.delete(`/ai-models/presets/${id}`)
}
