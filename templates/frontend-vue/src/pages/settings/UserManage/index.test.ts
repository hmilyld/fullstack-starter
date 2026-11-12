import { render, screen } from "@testing-library/vue"
import { createPinia, setActivePinia } from "pinia"
import { createMemoryHistory, createRouter } from "vue-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

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

import UserManage from "./index.vue"

describe("UserManage", () => {
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
          "users",
          "users.create",
          "users.edit",
          "users.delete",
          "users.assign_role",
        ],
      })
    )
  })

  it("renders the list shell, card list and table data", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/settings/user", component: { template: "<div />" } },
        { path: "/dashboard", component: { template: "<div />" } },
      ],
    })
    await router.push("/settings/user")
    await router.isReady()

    const pinia = createPinia()
    setActivePinia(pinia)

    render(UserManage, {
      global: { plugins: [pinia, router] },
    })

    expect(await screen.findByText("共 1 位用户")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "用户管理" })
    ).toBeInTheDocument()
    expect((await screen.findAllByText("张三")).length).toBeGreaterThan(0)
    expect((await screen.findAllByText("普通用户")).length).toBeGreaterThan(0)
  })
})
