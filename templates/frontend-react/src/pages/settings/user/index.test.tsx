import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { UsersPage } from "./index"

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    hasPermission: () => true,
    user: {
      id: "1",
      name: "管理员",
      email: "admin@example.com",
      role: "admin",
      permissions: [],
      avatar: "",
    },
  }),
}))

vi.mock("@/api/role", () => ({
  getRoles: vi.fn(async () => ({
    code: 0,
    message: "success",
    data: {
      list: [
        {
          id: "user",
          name: "普通用户",
          description: "",
          permissions: [],
          isPreset: true,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 100,
    },
  })),
}))

vi.mock("@/api/user", () => ({
  getUsers: vi.fn(async () => ({
    code: 0,
    message: "success",
    data: {
      list: [
        {
          id: "2",
          username: "zhangsan",
          name: "张三",
          email: "zhangsan@example.com",
          roleId: "user",
          avatar: "",
        },
      ],
      total: 1,
      page: 1,
      pageSize: 8,
    },
  })),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  resetPassword: vi.fn(),
  batchUpdateRole: vi.fn(),
}))

describe("UsersPage", () => {
  it("renders the list shell, card list and table data", async () => {
    render(<UsersPage />)

    expect(await screen.findByText("共 1 位用户")).toBeInTheDocument()
    expect(screen.getByText("用户列表")).toBeInTheDocument()
    expect(await screen.findAllByText("张三")).not.toHaveLength(0)
    expect(await screen.findAllByText("普通用户")).not.toHaveLength(0)
  })
})
