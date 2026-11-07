import { apiClient } from "@/api/client"
import type { PaginatedData } from "@/types/common"
import type { Role } from "@/types/role"

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
