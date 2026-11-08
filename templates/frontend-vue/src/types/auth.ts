export type AuthUser = {
  id: string
  name: string
  email: string
  avatar: string
  role: string
  permissions: string[]
}

export type LoginResponse = {
  token: string
  user: AuthUser
}

/** 注册请求体 */
export type RegisterPayload = {
  username: string
  email: string
  password: string
}
