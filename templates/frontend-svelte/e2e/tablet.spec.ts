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

test("collapses the sidebar when the viewport drops below 1280", async ({
  page,
}) => {
  await mockApi(page)
  await seedAuth(page)

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/dashboard")
  const sidebar = page.locator('[data-slot="sidebar"]').first()
  await expect(sidebar).toHaveAttribute("data-state", "expanded")

  await page.setViewportSize({ width: 1024, height: 768 })
  await expect(sidebar).toHaveAttribute("data-state", "collapsed")
})
