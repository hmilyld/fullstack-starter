export type Role = {
  id: string
  name: string
  description: string
  permissions: string[]
  isPreset: boolean
}

/** 新建角色请求体；id 与 isPreset 由服务端生成 */
export type RolePayload = Omit<Role, "id" | "isPreset">

/** 编辑角色请求体 */
export type RolePatch = Partial<RolePayload>
