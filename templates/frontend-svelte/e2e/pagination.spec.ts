import { expect, test } from "@playwright/test"

import { mockApi, seedAuth } from "./mocks"

test("keeps pagination on every paginated list page", async ({ page }) => {
  await mockApi(page)
  await seedAuth(page)

  const pages = [
    { path: "/settings/user", summary: "共 1 位用户，第 1 / 1 页" },
    { path: "/settings/role", summary: "共 1 个角色，第 1 / 1 页" },
  ]

  for (const { path, summary } of pages) {
    await page.goto(path)
    await expect(page.getByRole("navigation", { name: "分页" })).toBeVisible()
    await expect(page.getByText(summary)).toBeVisible()
  }
})
