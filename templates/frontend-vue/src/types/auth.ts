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
