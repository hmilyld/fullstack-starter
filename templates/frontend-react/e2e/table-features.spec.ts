import { expect, test } from "@playwright/test"

import { mockApi, seedAuth } from "./mocks"

test.beforeEach(async ({ page }) => {
  await mockApi(page)
  await seedAuth(page)
})

test("hides a column, remembers it and restores defaults", async ({ page }) => {
  await page.goto("/settings/user")

  await expect(page.getByRole("columnheader", { name: "姓名" })).toBeVisible()

  await page.getByRole("button", { name: "列", exact: true }).click()
  await page.getByRole("menuitemcheckbox", { name: "姓名" }).click()
  await page.keyboard.press("Escape")

  await expect(page.getByRole("columnheader", { name: "姓名" })).toHaveCount(0)

  await page.reload()
  await expect(page.getByRole("columnheader", { name: "姓名" })).toHaveCount(0)

  await page.getByRole("button", { name: "列", exact: true }).click()
  await page.getByRole("menuitem", { name: "恢复默认" }).click()
  await expect(page.getByRole("columnheader", { name: "姓名" })).toBeVisible()
})

test("changes the page size and returns to the first page", async ({
  page,
}) => {
  await page.goto("/settings/audit-log")

  const pageSize = page.getByRole("combobox", { name: "每页显示条数" })
  await expect(pageSize).toHaveText("10 条")

  await pageSize.click()
  await page.getByRole("option", { name: "20 条" }).click()
  await expect(pageSize).toHaveText("20 条")
})

test("selects rows with a floating toolbar cleared by Escape", async ({
  page,
}) => {
  await page.goto("/settings/user")

  await page.getByRole("checkbox", { name: "选择 张三" }).check()
  await expect(
    page.getByRole("toolbar", { name: /批量操作，已选 1 位用户/ })
  ).toBeVisible()
  await expect(page.getByRole("button", { name: "批量维护角色" })).toBeVisible()

  await page.keyboard.press("Escape")
  await expect(page.getByRole("toolbar", { name: /批量操作/ })).toHaveCount(0)
})

test("runs a theme action from the command palette", async ({ page }) => {
  await page.goto("/dashboard")
  await expect(
    page.getByRole("heading", { level: 1, name: "仪表盘" })
  ).toBeVisible()

  await page.keyboard.press("Control+K")
  const search = page.getByRole("combobox", { name: "搜索页面或菜单" })
  await expect(search).toBeVisible()
  await expect(page.getByRole("listbox", { name: "搜索结果" })).toBeVisible()

  await search.fill("深色")
  await expect(
    page.getByRole("option", { name: /切换为深色主题/ })
  ).toBeVisible()
  await page.keyboard.press("Enter")

  await expect(page.locator("html")).toHaveClass(/dark/)
})

test("navigates from the command palette", async ({ page }) => {
  await page.goto("/dashboard")
  await expect(
    page.getByRole("heading", { level: 1, name: "仪表盘" })
  ).toBeVisible()
  await page.keyboard.press("Control+K")
  const search = page.getByRole("combobox", { name: "搜索页面或菜单" })
  await search.fill("用户管理")
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/\/settings\/user$/)
})

test("warns before leaving a dirty settings form", async ({ page }) => {
  await page.goto("/settings/system")
  await page.locator("#site-name").fill("新的站点名称")

  await page.getByRole("link", { name: "用户管理" }).click()
  await expect(page.getByText("放弃未保存的修改？")).toBeVisible()

  await page.getByRole("button", { name: "留在本页" }).click()
  await expect(page).toHaveURL(/\/settings\/system$/)
  await expect(page.locator("#site-name")).toHaveValue("新的站点名称")
})

test("switches sidebar variant from the appearance drawer", async ({
  page,
}) => {
  await page.goto("/dashboard")
  await page.getByRole("button", { name: "外观设置" }).click()
  await page.getByRole("button", { name: "内嵌", exact: true }).click()
  await page.keyboard.press("Escape")

  await expect(page.locator('[data-variant="inset"]').first()).toBeAttached()
  await page.reload()
  await expect(page.locator('[data-variant="inset"]').first()).toBeAttached()
})

test("switches table density and keeps it after reload", async ({ page }) => {
  await page.goto("/settings/user")
  await expect(page.locator('[data-density="comfortable"]')).toBeVisible()

  await page.getByRole("button", { name: "表格密度" }).click()
  await page.getByRole("menuitem", { name: "紧凑" }).click()

  await expect(page.locator('[data-density="compact"]')).toBeVisible()
  expect(
    await page.evaluate(() => localStorage.getItem("table-density:users"))
  ).toBe("compact")

  await page.reload()
  await expect(page.locator('[data-density="compact"]')).toBeVisible()
})

test("shows recently visited pages in the command palette", async ({
  page,
}) => {
  await page.goto("/settings/user")
  await expect(
    page.getByRole("heading", { level: 1, name: "用户管理" })
  ).toBeVisible()
  await page.goto("/dashboard")
  await expect(
    page.getByRole("heading", { level: 1, name: "仪表盘" })
  ).toBeVisible()

  await page.keyboard.press("Control+K")
  await expect(page.getByText("最近", { exact: true })).toBeVisible()
  await expect(page.getByRole("option", { name: /用户管理/ })).toBeVisible()
})
