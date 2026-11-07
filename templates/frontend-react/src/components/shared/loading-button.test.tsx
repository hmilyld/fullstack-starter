import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { LoadingButton } from "./loading-button"

describe("LoadingButton", () => {
  it("exposes busy state and disables while loading", () => {
    const { rerender } = render(<LoadingButton>保存</LoadingButton>)

    expect(screen.getByRole("button", { name: "保存" })).not.toBeDisabled()

    rerender(<LoadingButton loading>保存</LoadingButton>)

    expect(screen.getByRole("button", { name: /保存/ })).toBeDisabled()
    expect(screen.getByRole("button", { name: /保存/ })).toHaveAttribute(
      "aria-busy",
      "true"
    )
    expect(screen.getByRole("status")).toHaveAccessibleName("加载中")
  })
})
