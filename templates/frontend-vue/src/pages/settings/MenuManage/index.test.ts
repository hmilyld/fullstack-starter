import { fireEvent, render, screen } from "@testing-library/vue"
import { createPinia, setActivePinia } from "pinia"
import { createMemoryHistory, createRouter } from "vue-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

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

import MenuManage from "./index.vue"

describe("MenuManage", () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem("token", "test-token")
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: "1",
        name: "管理员",
        email: "admin@example.com",
        avatar: "",
        role: "admin",
        permissions: [
          "menus",
          "menus.create",
          "menus.edit",
          "menus.delete",
          "menus.reorder",
          "permissions",
          "permissions.create",
          "permissions.edit",
          "permissions.delete",
        ],
      })
    )
  })

  it("renders hidden state and expands operation permissions", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/settings/menu", component: { template: "<div />" } },
        { path: "/settings/permission", component: { template: "<div />" } },
      ],
    })
    await router.push("/settings/menu")
    await router.isReady()

    const pinia = createPinia()
    setActivePinia(pinia)

    render(MenuManage, {
      global: { plugins: [pinia, router] },
    })

    expect(await screen.findByText("菜单与权限")).toBeInTheDocument()
    expect(await screen.findByText("用户管理")).toBeInTheDocument()
    expect(screen.getAllByText("已隐藏").length).toBeGreaterThan(0)

    fireEvent.click(
      screen.getByRole("button", { name: /展开 用户管理 的操作权限/ })
    )

    expect(await screen.findByText("新增用户")).toBeInTheDocument()
    expect(screen.getByText("users.create")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "新增 用户管理 的操作权限" })
    ).toBeInTheDocument()
  })
})
