export type User = {
  id: string
  username: string
  name: string
  email: string
  roleId: string
  avatar: string
}

/** 新建用户请求体 */
export type UserPayload = Omit<User, "id" | "avatar">

/** 编辑用户请求体；字段均可选，avatar 也走这里 */
export type UserPatch = Partial<Omit<User, "id">>

/** 修改个人资料请求体 */
export type ProfilePayload = {
  name: string
  email: string
}

/** 修改密码请求体 */
export type PasswordChangePayload = {
  currentPassword: string
  newPassword: string
}
