import { expect, test } from "@playwright/test"

import { mockApi, seedAuth } from "./mocks"

test("restores audit filters from the URL", async ({ page }) => {
  await mockApi(page)
  await seedAuth(page)

  await page.goto("/settings/audit-log?status=success")

  await expect(page.getByText("状态：成功")).toBeVisible()
  await expect(page.getByRole("combobox", { name: "状态" })).toHaveText("成功")
  await expect(page.getByRole("cell", { name: "login" })).toBeVisible()
})
