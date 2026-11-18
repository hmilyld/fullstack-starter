import { expect, test } from "@playwright/test"

import { mockApi, seedAuth } from "./mocks"

/**
 * Regression: opening a header dropdown used to lock body scroll. With the
 * page scrolled down that detached the sticky header, pushed the menu off
 * screen (the language menu "never opened") and left the page unresponsive.
 * Closing it then focused the trigger without `preventScroll`, which scrolled
 * the page back to the top.
 */
test("header dropdowns keep the scroll position and open below the header", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 500 })
  await mockApi(page)
  await seedAuth(page)
  await page.goto("/dashboard")
  await expect(
    page.getByRole("heading", { level: 1, name: "仪表盘" })
  ).toBeVisible()

  await page.evaluate(() =>
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "instant",
    })
  )
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0)
  const start = await page.evaluate(() => window.scrollY)

  for (const name of ["语言", "主题", "管理员 的账户菜单"]) {
    const trigger = page.getByRole("button", { name })
    // A plain click scrolls the sticky trigger into view first, which defeats
    // the assertion; click it where it is actually drawn.
    const box = await trigger.boundingBox()
    if (!box) throw new Error(`missing trigger: ${name}`)
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)

    const menu = page.getByRole("menu")
    await expect(menu).toBeVisible()
    const state = await page.evaluate(() => {
      const menu = document.querySelector<HTMLElement>('[role="menu"]')
      const header = document.querySelector("header")
      return {
        scrollY: window.scrollY,
        menuTop: Math.round(menu?.getBoundingClientRect().top ?? -1),
        headerTop: Math.round(header?.getBoundingClientRect().top ?? -1),
      }
    })
    expect(state.scrollY).toBe(start)
    expect(state.menuTop).toBeGreaterThan(0)
    expect(state.menuTop).toBeLessThan(100)
    expect(state.headerTop).toBe(0)

    await page.keyboard.press("Escape")
    await expect(menu).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(start)
    await expect(trigger).toBeFocused()
  }
})
