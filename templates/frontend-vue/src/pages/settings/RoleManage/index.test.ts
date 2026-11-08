import { fireEvent, render, screen, within } from "@testing-library/vue"
import { createPinia, setActivePinia } from "pinia"
import { createMemoryHistory, createRouter } from "vue-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

const roleState = vi.hoisted(() => ({
  permissions: ["dashboard"] as string[],
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
          description: "拥有基本的查看权限",
          permissions: [...roleState.permissions],
          isPreset: true,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 8,
    },
  })),
  createRole: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
}))

vi.mock("@/api/permission", () => ({
  getPermissions: vi.fn(async (params?: { type?: string }) => ({
    code: 0,
    message: "success",
    data:
      params?.type === "menu"
        ? [
            { code: "dashboard", name: "仪表盘", type: "menu" },
            { code: "users", name: "用户管理", type: "menu" },
            { code: "roles", name: "角色管理", type: "menu" },
          ]
        : [
            {
              code: "users.view",
              name: "查看用户",
              type: "operation",
              parent: "users",
            },
            {
              code: "users.create",
              name: "新增用户",
              type: "operation",
              parent: "users",
            },
            {
              code: "roles.view",
              name: "查看角色",
              type: "operation",
              parent: "roles",
            },
          ],
  })),
}))

import RoleManage from "./index.vue"

beforeEach(() => {
  roleState.permissions = ["dashboard"]
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
      permissions: ["roles", "roles.create", "roles.edit", "roles.delete"],
    })
  )
})

async function openEditor() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/settings/role", component: { template: "<div />" } }],
  })
  await router.push("/settings/role")
  await router.isReady()

  const pinia = createPinia()
  setActivePinia(pinia)

  render(RoleManage, {
    global: { plugins: [pinia, router] },
  })

  fireEvent.click(await screen.findByRole("button", { name: "编辑 普通用户" }))
  const dialog = await screen.findByRole("dialog")
  expect(within(dialog).getByText("权限分配")).toBeInTheDocument()
  return dialog
}

describe("RoleManage", () => {
  it("cascades menu selection and marks partial menus indeterminate", async () => {
    const dialog = await openEditor()

    expect(
      within(dialog).getByRole("checkbox", { name: "选择 用户管理" })
    ).not.toBeChecked()

    await fireEvent.click(
      within(dialog).getByRole("checkbox", { name: "选择 用户管理" })
    )
    expect(
      within(dialog).getByRole("checkbox", { name: "选择 查看用户" })
    ).toBeChecked()
    expect(
      within(dialog).getByRole("checkbox", { name: "选择 新增用户" })
    ).toBeChecked()

    await fireEvent.click(
      within(dialog).getByRole("checkbox", { name: "选择 查看用户" })
    )
    expect(
      within(dialog).getByRole("checkbox", { name: "选择 用户管理" })
    ).toBePartiallyChecked()
  })

  it("treats a menu-only grant as checked and removes it on click", async () => {
    roleState.permissions = ["dashboard", "users"]
    const dialog = await openEditor()

    expect(
      within(dialog).getByRole("checkbox", { name: "选择 用户管理" })
    ).toBeChecked()
    expect(within(dialog).getByText("0/2 个操作")).toBeInTheDocument()
    expect(within(dialog).getByText("无操作权限")).toBeInTheDocument()

    await fireEvent.click(
      within(dialog).getByRole("checkbox", { name: "选择 用户管理" })
    )

    expect(
      within(dialog).getByRole("checkbox", { name: "选择 用户管理" })
    ).not.toBeChecked()
    expect(
      within(dialog).getByRole("checkbox", { name: "选择 查看用户" })
    ).not.toBeChecked()
  })

  it("adds the parent menu when an operation is selected", async () => {
    const dialog = await openEditor()

    await fireEvent.click(
      within(dialog).getByRole("checkbox", { name: "选择 查看用户" })
    )

    expect(
      within(dialog).getByRole("checkbox", { name: "选择 查看用户" })
    ).toBeChecked()
    expect(
      within(dialog).getByRole("checkbox", { name: "选择 用户管理" })
    ).toBePartiallyChecked()
    expect(within(dialog).getByText("1/2 个操作")).toBeInTheDocument()
  })

  it("selects all, clears and filters permissions", async () => {
    const dialog = await openEditor()

    await fireEvent.click(within(dialog).getByRole("button", { name: "全选" }))
    expect(within(dialog).getByText("已选 6 / 6 项")).toBeInTheDocument()

    await fireEvent.click(within(dialog).getByRole("button", { name: "清空" }))
    expect(within(dialog).getByText("已选 0 / 6 项")).toBeInTheDocument()

    await fireEvent.update(
      within(dialog).getByRole("textbox", { name: "搜索权限" }),
      "角色"
    )
    expect(within(dialog).queryByText("用户管理")).not.toBeInTheDocument()
    expect(within(dialog).getByText("角色管理")).toBeInTheDocument()
  })
})
