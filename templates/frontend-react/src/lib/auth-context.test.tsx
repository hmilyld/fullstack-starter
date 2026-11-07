import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"

import { AuthProvider, useAuth } from "./auth-context"

function Consumer() {
  const { user, isAuthenticated, hasPermission, login, logout, updateUser } =
    useAuth()

  return (
    <div>
      <span data-testid="name">{user?.name ?? "none"}</span>
      <span data-testid="auth">{String(isAuthenticated)}</span>
      <span data-testid="perm">{String(hasPermission("users.edit"))}</span>
      <button
        type="button"
        onClick={() =>
          login("token", {
            id: "1",
            name: "管理员",
            email: "admin@example.com",
            avatar: "",
            role: "user",
            permissions: ["users.edit"],
          })
        }
      >
        login
      </button>
      <button type="button" onClick={() => updateUser({ name: "新名字" })}>
        update
      </button>
      <button type="button" onClick={logout}>
        logout
      </button>
    </div>
  )
}

describe("AuthProvider", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("logs in, updates the user and logs out", async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    )

    expect(screen.getByTestId("name")).toHaveTextContent("none")
    expect(screen.getByTestId("auth")).toHaveTextContent("false")
    expect(screen.getByTestId("perm")).toHaveTextContent("false")

    await user.click(screen.getByRole("button", { name: "login" }))
    expect(screen.getByTestId("name")).toHaveTextContent("管理员")
    expect(screen.getByTestId("auth")).toHaveTextContent("true")
    expect(screen.getByTestId("perm")).toHaveTextContent("true")
    expect(localStorage.getItem("token")).toBe("token")

    await user.click(screen.getByRole("button", { name: "update" }))
    expect(screen.getByTestId("name")).toHaveTextContent("新名字")
    expect(JSON.parse(localStorage.getItem("user") ?? "{}").name).toBe("新名字")

    await user.click(screen.getByRole("button", { name: "logout" }))
    expect(screen.getByTestId("name")).toHaveTextContent("none")
    expect(screen.getByTestId("auth")).toHaveTextContent("false")
    expect(localStorage.getItem("token")).toBeNull()
    expect(localStorage.getItem("user")).toBeNull()
  })

  it("discards invalid stored user JSON", () => {
    localStorage.setItem("token", "stale")
    localStorage.setItem("user", "{invalid")

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    )

    expect(screen.getByTestId("name")).toHaveTextContent("none")
    expect(screen.getByTestId("auth")).toHaveTextContent("false")
    expect(localStorage.getItem("user")).toBeNull()
  })
})
