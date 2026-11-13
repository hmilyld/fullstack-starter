import { describe, expect, it } from "vitest"
import { page } from "vitest/browser"
import { render } from "vitest-browser-svelte"

import DateTimeField from "./date-time-field.svelte"

describe("DateTimeField", () => {
  it("opens the calendar and shows the formatted value", async () => {
    render(DateTimeField, { value: "2026-11-12T08:30" })

    await expect
      .element(page.getByRole("button", { name: /2026\/11\/12 08:30/ }))
      .toBeInTheDocument()

    await page.getByRole("button", { name: /2026\/11\/12 08:30/ }).click()
    await expect
      .element(page.getByRole("button", { name: "完成" }))
      .toBeVisible()
  })
})
