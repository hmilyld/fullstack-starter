import { render, screen } from "@testing-library/vue"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import FormDialog from "./FormDialog.vue"

const input = '<input aria-label="姓名" />'

describe("FormDialog", () => {
  it("renders a titled dialog and closes from the cancel button", async () => {
    const user = userEvent.setup()
    const onUpdateOpen = vi.fn()

    render(FormDialog, {
      props: {
        open: true,
        title: "编辑用户",
        description: "修改用户信息。",
      },
      attrs: { "onUpdate:open": onUpdateOpen },
      slots: { default: input },
    })

    expect(await screen.findByText("编辑用户")).toBeInTheDocument()
    expect(screen.getByText("修改用户信息。")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "取消" }))
    expect(onUpdateOpen).toHaveBeenCalledWith(false)
  })

  it("submits and exposes the loading state", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    const { rerender } = render(FormDialog, {
      props: { open: true, title: "新增用户" },
      attrs: { onSubmit },
      slots: { default: input },
    })

    await user.click(await screen.findByRole("button", { name: "保存" }))
    expect(onSubmit).toHaveBeenCalledTimes(1)

    await rerender({ submitting: true })

    expect(screen.getByRole("button", { name: /保存/ })).toHaveAttribute(
      "aria-busy",
      "true"
    )
    expect(screen.getByRole("button", { name: "取消" })).toBeDisabled()
  })
})
