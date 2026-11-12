import { expect, test } from "@playwright/test"

import { mockApi, seedAuth } from "./mocks"

test.use({ viewport: { width: 1024, height: 768 } })

test("starts with a collapsed sidebar on tablet even with a saved expanded state", async ({
  page,
}) => {
  await mockApi(page)
  await seedAuth(page)
  await page.goto("/dashboard")

  const origin = new URL(page.url()).origin
  await page
    .context()
    .addCookies([{ name: "sidebar_state", value: "true", url: origin }])
  await page.reload()

  await expect(
    page.locator('[data-slot="sidebar"][data-state="collapsed"]')
  ).toHaveCount(1)
})
