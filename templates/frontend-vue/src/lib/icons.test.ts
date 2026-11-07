import { describe, expect, it } from "vitest"
import { iconOptions, menuIcons } from "./icons"

describe("menu icons", () => {
  it("provides an icon for every picker option", () => {
    for (const option of iconOptions) {
      expect(menuIcons[option.value]).toBeTruthy()
    }
  })

  it("keeps unique option values", () => {
    const values = iconOptions.map((option) => option.value)
    expect(new Set(values).size).toBe(values.length)
  })

  it("contains the default icon", () => {
    expect(menuIcons.circle).toBeTruthy()
  })
})
