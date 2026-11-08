import { apiClient } from "@/api/client"
import type { PageParams, PaginatedData } from "@/types/common"
import type { Role, RolePatch, RolePayload } from "@/types/role"

export async function getRoles(params?: PageParams) {
  return apiClient.get<PaginatedData<Role>>("/roles", params)
}

export async function createRole(data: RolePayload) {
  return apiClient.post<Role>("/roles", data)
}

export async function updateRole(id: string, data: RolePatch) {
  return apiClient.put<Role>(`/roles/${id}`, data)
}

export async function deleteRole(id: string) {
  return apiClient.delete(`/roles/${id}`)
}
