import { expect, test } from "@playwright/test"

import { mockApi, seedAuth } from "./mocks"

test("footer shows the copyright holder and the build version", async ({
  page,
}) => {
  await mockApi(page)
  await seedAuth(page)
  await page.goto("/dashboard")

  const footer = page.locator("footer")
  await expect(footer).toContainText("hmilyld.com")
  // 版本号来自 package.json，不要把常量写回页脚
  await expect(footer).toContainText(/v\d+\.\d+\.\d+/)
})
