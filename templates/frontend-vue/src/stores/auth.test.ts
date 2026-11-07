import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, it } from "vitest"
import { useAuthStore } from "./auth"
import type { AuthUser } from "@/types/auth"

const admin: AuthUser = {
  id: "1",
  name: "管理员",
  email: "admin@example.com",
  avatar: "",
  role: "admin",
  permissions: ["users", "users.create"],
}

describe("auth store", () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it("restores a stored user safely", () => {
    localStorage.setItem("user", JSON.stringify(admin))
    localStorage.setItem("token", "token")

    const auth = useAuthStore()

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.user?.name).toBe("管理员")
    expect(auth.hasPermission("users")).toBe(true)
    expect(auth.hasPermission("users.delete")).toBe(false)
  })

  it("clears corrupt stored user data", () => {
    localStorage.setItem("user", "{not-json")
    localStorage.setItem("token", "token")

    const auth = useAuthStore()

    expect(auth.user).toBeNull()
    expect(auth.isAuthenticated).toBe(false)
    expect(localStorage.getItem("user")).toBeNull()
  })

  it("logs in, updates and logs out", () => {
    const auth = useAuthStore()

    auth.login("token", admin)
    expect(auth.isAuthenticated).toBe(true)
    expect(localStorage.getItem("token")).toBe("token")

    auth.updateUser({ name: "新名字" })
    expect(auth.user?.name).toBe("新名字")
    expect(JSON.parse(localStorage.getItem("user") || "{}").name).toBe("新名字")

    auth.logout()
    expect(auth.isAuthenticated).toBe(false)
    expect(localStorage.getItem("token")).toBeNull()
    expect(localStorage.getItem("user")).toBeNull()
  })

  it("treats missing permissions as no access", () => {
    const auth = useAuthStore()
    expect(auth.hasPermission("users")).toBe(false)
  })
})
