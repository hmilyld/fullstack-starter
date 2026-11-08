import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"

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

vi.mock("@/api/menu", () => ({
  getMenuConfig: vi.fn(async () => ({
    code: 0,
    message: "success",
    data: {
      version: 1,
      groups: [
        {
          id: "management",
          name: "管理",
          sortOrder: 1,
          isSystem: true,
          items: [
            {
              permissionCode: "users",
              name: "用户管理",
              groupId: "management",
              route: "/settings/user",
              icon: "users",
              sortOrder: 1,
              isSystem: true,
              hidden: true,
              operations: [{ code: "users.create", name: "新增用户" }],
            },
          ],
        },
      ],
    },
  })),
  saveMenuLayout: vi.fn(),
  createMenuGroup: vi.fn(),
  updateMenuGroup: vi.fn(),
  deleteMenuGroup: vi.fn(),
  createMenuItem: vi.fn(),
  updateMenuItem: vi.fn(),
  deleteMenuItem: vi.fn(),
}))

vi.mock("@/api/permission", () => ({
  createPermission: vi.fn(),
  updatePermission: vi.fn(),
  deletePermission: vi.fn(),
}))

import { MenuPage } from "./index"

describe("MenuPage", () => {
  it("renders the tree with hidden state and expands operation permissions", async () => {
    render(
      <MemoryRouter>
        <MenuPage />
      </MemoryRouter>
    )

    expect(await screen.findByText("菜单与权限")).toBeInTheDocument()
    expect(await screen.findByText("用户管理")).toBeInTheDocument()
    expect(screen.getByText("已隐藏")).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole("button", { name: /展开 用户管理 的操作权限/ })
    )

    expect(await screen.findByText("新增用户")).toBeInTheDocument()
    expect(screen.getByText("users.create")).toBeInTheDocument()
    expect(screen.getByText("新增操作")).toBeInTheDocument()
  })
})
