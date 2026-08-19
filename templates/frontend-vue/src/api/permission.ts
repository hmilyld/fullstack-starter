import { apiClient } from '@/api/client'
import type { Permission } from '@/types/permission'

export async function getPermissions(params?: {
  type?: 'menu' | 'operation'
  parent?: string
}) {
  return apiClient.get<Permission[]>('/permissions', params)
}

export async function createPermission(data: Permission) {
  return apiClient.post<Permission>('/permissions', data)
}

export async function updatePermission(
  code: string,
  data: Partial<Pick<Permission, 'name' | 'parent'>>
) {
  return apiClient.put<Permission>(`/permissions/${code}`, data)
}

export async function deletePermission(code: string) {
  return apiClient.delete(`/permissions/${code}`)
}

export async function syncPermissions() {
  return apiClient.post<{ added: string[]; updated: string[]; granted: string[] }>('/permissions/sync')
}
