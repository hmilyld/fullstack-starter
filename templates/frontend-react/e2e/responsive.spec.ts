import { expect, test } from "@playwright/test"

import { mockApi, seedAuth } from "./mocks"

test.use({ viewport: { width: 390, height: 844 } })

test("uses cards, URL search state and mobile navigation", async ({ page }) => {
  await mockApi(page)
  await seedAuth(page)

  await page.goto("/settings/user?q=张")

  await expect(page.getByRole("textbox", { name: "搜索用户" })).toHaveValue(
    "张"
  )
  await expect(page.getByText("共 1 位用户", { exact: true })).toBeVisible()

  const more = page.getByRole("button", { name: "更多操作" }).first()
  await expect(more).toBeVisible()
  await more.click()
  await expect(page.getByRole("menuitem", { name: "编辑" })).toBeVisible()
  await page.keyboard.press("Escape")

  await page.getByRole("button", { name: "切换侧边栏" }).first().click()
  const sheet = page.getByRole("dialog")
  await expect(sheet).toBeVisible()
  await expect(sheet.getByRole("link", { name: "用户管理" })).toBeVisible()
})
