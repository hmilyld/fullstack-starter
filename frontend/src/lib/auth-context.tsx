import * as React from "react"

type User = {
  id: string
  name: string
  email: string
  avatar: string
  role: string
  permissions: string[]
}

type AuthContextType = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  hasPermission: (code: string) => boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = React.createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(() => {
    const stored = localStorage.getItem("user")
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = React.useState<string | null>(() =>
    localStorage.getItem("token")
  )

  const isAuthenticated = !!token && !!user

  const hasPermission = React.useCallback(
    (code: string) => {
      if (!user) return false
      if (user.role === "admin") return true
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

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, hasPermission, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}