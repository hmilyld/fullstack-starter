import { defineStore } from "pinia"
import { ref, computed } from "vue"
import type { AuthUser } from "@/types/auth"

function loadUser(): AuthUser | null {
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
  return localStorage.getItem("token")
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref<AuthUser | null>(loadUser())
  const token = ref<string | null>(loadToken())

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  function hasPermission(code: string): boolean {
    if (!user.value) return false
    return user.value.permissions.includes(code)
  }

  function login(newToken: string, newUser: AuthUser) {
    localStorage.setItem("token", newToken)
    localStorage.setItem("user", JSON.stringify(newUser))
    token.value = newToken
    user.value = newUser
  }

  function logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    token.value = null
    user.value = null
  }

  function updateUser(patch: Partial<AuthUser>) {
    if (!user.value) return
    const next = { ...user.value, ...patch }
    localStorage.setItem("user", JSON.stringify(next))
    user.value = next
  }

  return {
    user,
    token,
    isAuthenticated,
    hasPermission,
    login,
    logout,
    updateUser,
  }
})
