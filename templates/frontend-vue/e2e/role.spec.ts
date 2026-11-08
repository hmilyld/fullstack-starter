import { expect, test } from "@playwright/test"

import { mockApi, seedAuth } from "./mocks"

test("edits role permissions in the wide table", async ({ page }) => {
  await mockApi(page)
  await seedAuth(page)

  await page.goto("/settings/role")
  await expect(
    page.getByRole("button", { name: "编辑 普通用户" })
  ).toBeVisible()

  await page.getByRole("button", { name: "编辑 普通用户" }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog.getByText("权限分配", { exact: true })).toBeVisible()
  await expect(dialog.locator("table")).toBeVisible()

  const menu = dialog.getByRole("checkbox", { name: "选择 用户管理" })
  await menu.click()
  await expect(
    dialog.getByRole("checkbox", { name: "选择 查看用户" })
  ).toBeChecked()
  await expect(
    dialog.getByRole("checkbox", { name: "选择 新增用户" })
  ).toBeChecked()

  await dialog.getByRole("checkbox", { name: "选择 查看用户" }).click()
  await expect(menu).toHaveAttribute("aria-checked", "mixed")

  const request = page.waitForRequest(
    (req) => req.method() === "PUT" && req.url().includes("/api/roles/user")
  )
  await dialog.getByRole("button", { name: "保存" }).click()
  const payload = (await request).postDataJSON() as { permissions: string[] }
  expect(payload.permissions).toContain("users")
  expect(payload.permissions).toContain("users.create")
  expect(payload.permissions).not.toContain("users.view")
})

test("shows accordion permission cards on compact viewports", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockApi(page)
  await seedAuth(page)

  await page.goto("/settings/role")
  await expect(
    page.getByRole("button", { name: "更多操作" }).first()
  ).toBeVisible()

  await page.getByRole("button", { name: "更多操作" }).first().click()
  await page.getByRole("menuitem", { name: "编辑" }).click()

  const dialog = page.getByRole("dialog")
  await expect(dialog.getByText("权限分配", { exact: true })).toBeVisible()
  await expect(dialog.locator("table")).toHaveCount(0)

  await expect(
    dialog.getByRole("checkbox", { name: "选择 用户管理" })
  ).toBeVisible()
  await expect(dialog.getByText("查看用户")).toBeVisible()

  await dialog.getByRole("checkbox", { name: "选择 用户管理" }).click()
  await expect(
    dialog.getByRole("checkbox", { name: "选择 查看用户" })
  ).toBeChecked()
})
