import { render, screen } from "@testing-library/vue"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import TablePagination from "./TablePagination.vue"

describe("TablePagination", () => {
  it("shows totals and emits page changes", async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()

    render(TablePagination, {
      props: { page: 2, totalPages: 5, total: 42 },
      attrs: { "onPage-change": onPageChange },
    })

    expect(screen.getByText("共 42 条记录，第 2 / 5 页")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "上一页" }))
    expect(onPageChange).toHaveBeenCalledWith(1)

    await user.click(screen.getByRole("button", { name: "下一页" }))
    expect(onPageChange).toHaveBeenCalledWith(3)

    await user.click(screen.getByRole("button", { name: "5" }))
    expect(onPageChange).toHaveBeenCalledWith(5)
  })

  it("disables edge navigation", async () => {
    const { rerender } = render(TablePagination, {
      props: { page: 1, totalPages: 3, total: 20 },
      attrs: { "onPage-change": vi.fn() },
    })

    expect(screen.getByRole("button", { name: "上一页" })).toBeDisabled()

    await rerender({ page: 3, totalPages: 3, total: 20 })

    expect(screen.getByRole("button", { name: "下一页" })).toBeDisabled()
  })
})
