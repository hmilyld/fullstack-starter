import { apiClient } from "#lib/api/client.js"
import type { PageParams, PaginatedData } from "#lib/types/common.js"
import type {
  PasswordChangePayload,
  ProfilePayload,
  User,
  UserPatch,
  UserPayload,
} from "#lib/types/user.js"

export async function getUsers(params?: PageParams) {
  return apiClient.get<PaginatedData<User>>("/users", params)
}

export async function getUser(id: string) {
  return apiClient.get<User>(`/users/${id}`)
}

export async function createUser(data: UserPayload) {
  return apiClient.post<User>("/users", data)
}

export async function updateUser(id: string, data: UserPatch) {
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

export async function updateMe(data: ProfilePayload) {
  return apiClient.put<User>("/users/me", data)
}

export async function changePassword(data: PasswordChangePayload) {
  return apiClient.put("/users/me/password", data)
}
