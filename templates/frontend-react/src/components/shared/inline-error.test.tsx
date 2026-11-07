import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { InlineError } from "./inline-error"

describe("InlineError", () => {
  it("shows the message and a retry action", async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(<InlineError message="刷新失败" onRetry={onRetry} />)

    expect(screen.getByRole("alert")).toHaveTextContent("刷新失败")
    await user.click(screen.getByRole("button", { name: "重试" }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
