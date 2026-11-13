import { apiClient } from "#lib/api/client.js"
import type {
  Permission,
  PermissionQuery,
  PermissionSyncResult,
} from "#lib/types/permission.js"

export async function getPermissions(params?: PermissionQuery) {
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

export async function syncPermissions() {
  return apiClient.post<PermissionSyncResult>("/permissions/sync")
}
