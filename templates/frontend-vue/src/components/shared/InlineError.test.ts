import { render, screen } from "@testing-library/vue"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import InlineError from "./InlineError.vue"

describe("InlineError", () => {
  it("shows the message and a retry action", async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(InlineError, {
      props: { message: "刷新失败", onRetry },
    })

    expect(screen.getByRole("alert")).toHaveTextContent("刷新失败")
    await user.click(screen.getByRole("button", { name: "重试" }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
