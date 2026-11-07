import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { PasswordInput } from "./password-input"

describe("PasswordInput", () => {
  it("toggles between password and text", async () => {
    const user = userEvent.setup()

    render(<PasswordInput aria-label="密码" defaultValue="secret123" />)

    const input = screen.getByLabelText("密码")
    expect(input).toHaveAttribute("type", "password")

    await user.click(screen.getByRole("button", { name: "显示密码" }))
    expect(input).toHaveAttribute("type", "text")

    await user.click(screen.getByRole("button", { name: "隐藏密码" }))
    expect(input).toHaveAttribute("type", "password")
  })
})
