import * as React from "react"

import type { AuthUser } from "@/types/auth"

type User = AuthUser

type AuthContextType = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  hasPermission: (code: string) => boolean
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (patch: Partial<User>) => void
}

const AuthContext = React.createContext<AuthContextType | null>(null)

function readStoredUser(): User | null {
  const stored = localStorage.getItem("user")
  if (!stored) return null

  try {
    return JSON.parse(stored) as User
  } catch {
    localStorage.removeItem("user")
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(readStoredUser)
  const [token, setToken] = React.useState<string | null>(() =>
    localStorage.getItem("token")
  )

  const isAuthenticated = !!token && !!user

  const hasPermission = React.useCallback(
    (code: string) => {
      if (!user) return false
      return user.permissions.includes(code)
    },
    [user]
  )

  const login = React.useCallback((newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken)
    localStorage.setItem("user", JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = React.useCallback(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = React.useCallback((patch: Partial<User>) => {
    setUser((current) => {
      if (!current) return current
      const next = { ...current, ...patch }
      localStorage.setItem("user", JSON.stringify(next))
      return next
    })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        hasPermission,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
