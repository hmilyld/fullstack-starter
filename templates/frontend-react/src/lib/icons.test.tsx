import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { iconOptions, MenuIcon } from "./icons"

describe("MenuIcon", () => {
  it("renders a registered icon", () => {
    const { container } = render(<MenuIcon name="users" />)
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("falls back to the default icon", () => {
    const { container } = render(<MenuIcon name="unknown-icon" />)
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("exposes picker options", () => {
    expect(iconOptions.length).toBeGreaterThan(0)
    expect(iconOptions[0]?.value).toBe("circle")
  })
})
