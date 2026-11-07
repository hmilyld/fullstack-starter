import { expect, test } from "@playwright/test"

import { mockApi } from "./mocks"

test("logs in and lands on the dashboard", async ({ page }) => {
  await mockApi(page)
  await page.goto("/login")

  await page.getByLabel("邮箱或用户名").fill("admin")
  await page.getByLabel("密码", { exact: true }).fill("123456")
  await page.getByRole("button", { name: "登录" }).click()

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "仪表盘" })
  ).toBeVisible()
  await expect(page.getByText("总用户数")).toBeVisible()

  await page.getByRole("button", { name: /的账户菜单$/ }).click()
  await expect(page.getByRole("menuitem", { name: "个人设置" })).toBeVisible()
})
