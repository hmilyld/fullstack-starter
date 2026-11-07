import { apiClient } from "@/api/client"
import type { PaginatedData } from "@/types/common"
import type { User } from "@/types/user"

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
