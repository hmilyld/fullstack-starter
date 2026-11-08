import { expect, test } from "@playwright/test"

import { mockApi, seedAuth } from "./mocks"

test("opens menu & permissions and expands operation permissions", async ({
  page,
}) => {
  await mockApi(page)
  await seedAuth(page)

  await page.goto("/settings/menu")

  await expect(page.getByRole("heading", { name: "菜单与权限" })).toBeVisible()
  await expect(page.getByText("/settings/user")).toBeVisible()

  await page
    .getByRole("button", {
      name: "展开 用户管理 的操作权限",
      exact: true,
    })
    .click()

  await expect(page.getByText("新增用户")).toBeVisible()
  await expect(page.getByText("users.create")).toBeVisible()

  await page
    .getByRole("button", { name: "菜单与权限 的操作", exact: true })
    .click()
  await page.getByRole("menuitem", { name: "隐藏菜单" }).click()
  await expect(page.getByText("确认隐藏菜单")).toBeVisible()
  await page.getByRole("button", { name: "取消" }).click()
  await expect(page.getByText("确认隐藏菜单")).not.toBeVisible()
})

test("disables structural actions while sorting is saving", async ({
  page,
}) => {
  await mockApi(page)
  await seedAuth(page)

  await page.goto("/settings/menu")
  await expect(page.getByText("/settings/user")).toBeVisible()

  await page
    .getByRole("button", { name: "用户管理 的操作", exact: true })
    .click()
  await page.getByRole("menuitem", { name: "下移" }).click()

  const addGroup = page.getByRole("button", { name: "新增分组" })
  await expect(addGroup).toBeDisabled()
  await expect(addGroup).toBeEnabled({ timeout: 5000 })
})

test("confirms hiding a critical menu from the edit form", async ({ page }) => {
  await mockApi(page)
  await seedAuth(page)

  await page.goto("/settings/menu")
  await expect(page.getByText("/settings/user")).toBeVisible()

  await page
    .getByRole("button", { name: "菜单与权限 的操作", exact: true })
    .click()
  await page.getByRole("menuitem", { name: "编辑" }).click()
  await expect(page.getByText("编辑菜单")).toBeVisible()

  await page.locator("#item-visible").click()
  await page.getByRole("button", { name: "保存" }).click()

  const confirm = page.getByRole("alertdialog")
  await expect(confirm.getByText("确认隐藏菜单")).toBeVisible()
  await confirm.getByRole("button", { name: "取消" }).click()

  await expect(page.getByText("确认隐藏菜单")).not.toBeVisible()
  await expect(page.getByText("编辑菜单")).toBeVisible()
})
