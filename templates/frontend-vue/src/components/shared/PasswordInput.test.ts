import { render, screen } from "@testing-library/vue"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import PasswordInput from "./PasswordInput.vue"

describe("PasswordInput", () => {
  it("toggles between password and text", async () => {
    const user = userEvent.setup()

    render(PasswordInput, {
      attrs: { "aria-label": "密码" },
      props: { modelValue: "secret123" },
    })

    const input = screen.getByLabelText("密码")
    expect(input).toHaveAttribute("type", "password")

    await user.click(screen.getByRole("button", { name: "显示密码" }))
    expect(input).toHaveAttribute("type", "text")

    await user.click(screen.getByRole("button", { name: "隐藏密码" }))
    expect(input).toHaveAttribute("type", "password")
  })
})
