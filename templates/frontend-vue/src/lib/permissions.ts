export type PermissionType = 'menu' | 'operation'

export type Permission = {
  code: string
  name: string
  type: PermissionType
  parent?: string
}

export type Role = {
  id: string
  name: string
  description: string
  permissions: string[]
  isPreset: boolean
}
