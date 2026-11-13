import type { AuthUser } from "#lib/types/auth.js"

function loadUser(): AuthUser | null {
  if (typeof localStorage === "undefined") return null
  try {
    const stored = localStorage.getItem("user")
    if (!stored) return null
    const parsed = JSON.parse(stored) as AuthUser
    if (!parsed || typeof parsed !== "object") return null
    return {
      ...parsed,
      permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
    }
  } catch {
    localStorage.removeItem("user")
    return null
  }
}

function loadToken(): string | null {
  if (typeof localStorage === "undefined") return null
  return localStorage.getItem("token")
}

let user = $state<AuthUser | null>(loadUser())
let token = $state<string | null>(loadToken())

export const auth = {
  get user() {
    return user
  },
  get token() {
    return token
  },
  get isAuthenticated() {
    return !!token && !!user
  },
  hasPermission(code: string) {
    if (!user) return false
    return user.permissions.includes(code)
  },
  login(newToken: string, newUser: AuthUser) {
    localStorage.setItem("token", newToken)
    localStorage.setItem("user", JSON.stringify(newUser))
    token = newToken
    user = newUser
  },
  logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    token = null
    user = null
  },
  updateUser(patch: Partial<AuthUser>) {
    if (!user) return
    const next = { ...user, ...patch }
    localStorage.setItem("user", JSON.stringify(next))
    user = next
  },
}
