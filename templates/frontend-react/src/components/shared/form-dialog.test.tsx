import type { FormEvent } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { FormDialog } from "./form-dialog"

describe("FormDialog", () => {
  it("renders a titled dialog and closes from the cancel button", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <FormDialog
        open
        onOpenChange={onOpenChange}
        title="编辑用户"
        description="修改用户信息。"
        onSubmit={vi.fn()}
      >
        <input aria-label="姓名" />
      </FormDialog>
    )

    expect(screen.getByRole("dialog", { name: "编辑用户" })).toBeInTheDocument()
    expect(screen.getByText("修改用户信息。")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "取消" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("submits and exposes the loading state", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) =>
      event.preventDefault()
    )

    const { rerender } = render(
      <FormDialog
        open
        onOpenChange={vi.fn()}
        title="新增用户"
        onSubmit={onSubmit}
      >
        <input aria-label="姓名" />
      </FormDialog>
    )

    await user.click(screen.getByRole("button", { name: "保存" }))
    expect(onSubmit).toHaveBeenCalledTimes(1)

    rerender(
      <FormDialog
        open
        onOpenChange={vi.fn()}
        title="新增用户"
        onSubmit={onSubmit}
        submitting
      >
        <input aria-label="姓名" />
      </FormDialog>
    )

    expect(screen.getByRole("button", { name: /保存/ })).toHaveAttribute(
      "aria-busy",
      "true"
    )
    expect(screen.getByRole("button", { name: "取消" })).toBeDisabled()
  })
})
