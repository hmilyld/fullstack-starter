import { expect, test } from "@playwright/test"

import { mockApi, seedAuth } from "./mocks"

test("picks a date and time without the native control", async ({ page }) => {
  await mockApi(page)
  await seedAuth(page)
  await page.goto("/settings/audit-log")

  const start = page.locator("#audit-start")
  await expect(start).toHaveText("选择日期时间")
  await expect(page.locator('input[type="datetime-local"]')).toHaveCount(0)

  await start.click()
  await page.getByRole("button", { name: "2026-11-12" }).click()

  const hour = page.getByRole("textbox", { name: "小时" })
  await hour.fill("08")
  await page.getByRole("textbox", { name: "分钟" }).fill("30")
  await page.getByRole("button", { name: "完成" }).click()

  await expect(start).toHaveText("2026-11-12 08:30")

  await page.getByRole("button", { name: "查询" }).click()
  await expect(page).toHaveURL(/startTime=2026-11-12T08(:|%3A)30/)
})

test("keeps the date control the same height as the text inputs", async ({
  page,
}) => {
  await mockApi(page)
  await seedAuth(page)
  await page.goto("/settings/audit-log")
  await expect(page.locator("#audit-start")).toBeVisible()

  const heights = await page.evaluate(() =>
    ["audit-user", "audit-start", "audit-end"].map((id) => {
      const element = document.getElementById(id)
      if (!element) throw new Error(`missing #${id}`)
      return Math.round(element.getBoundingClientRect().height)
    })
  )

  expect(new Set(heights).size).toBe(1)
})

test("clears a picked value", async ({ page }) => {
  await mockApi(page)
  await seedAuth(page)
  await page.goto("/settings/audit-log?startTime=2026-11-12T08:30")

  const start = page.locator("#audit-start")
  await expect(start).toHaveText("2026-11-12 08:30")

  await start.click()
  await expect(
    page.getByRole("button", { name: "2026-11-12" })
  ).toHaveAttribute("aria-pressed", "true")
  await page.getByRole("button", { name: "清除", exact: true }).click()
  await page.getByRole("button", { name: "完成" }).click()

  await expect(start).toHaveText("选择日期时间")
})
