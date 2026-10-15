import { apiClient } from "@/api/client"
import type { MenuConfig, NavigationGroup } from "@/types/menu"

export function getNavigation() {
  return apiClient.get<NavigationGroup[]>("/menus/navigation")
}

export function getMenuConfig() {
  return apiClient.get<MenuConfig>("/menus")
}

export function createMenuGroup(name: string) {
  return apiClient.post("/menus/groups", { name })
}

export function updateMenuGroup(id: string, name: string) {
  return apiClient.put(`/menus/groups/${id}`, { name })
}

export function deleteMenuGroup(id: string) {
  return apiClient.delete(`/menus/groups/${id}`)
}

export function createMenuItem(data: {
  permissionCode: string
  name: string
  groupId: string
  route: string
  icon: string
}) {
  return apiClient.post("/menus/items", data)
}

export function updateMenuItem(
  permissionCode: string,
  data: {
    name?: string
    groupId?: string
    route?: string
    icon?: string
  }
) {
  return apiClient.put(`/menus/items/${permissionCode}`, data)
}

export function deleteMenuItem(permissionCode: string) {
  return apiClient.delete(`/menus/items/${permissionCode}`)
}

export function saveMenuLayout(data: {
  version: number
  groups: Array<{
    id: string
    sortOrder: number
    items: Array<{ permissionCode: string; sortOrder: number }>
  }>
}) {
  return apiClient.put<{ version: number }>("/menus/layout", data)
}
