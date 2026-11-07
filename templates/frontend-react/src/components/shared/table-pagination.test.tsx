import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { TablePagination } from "./table-pagination"

describe("TablePagination", () => {
  it("shows totals and calls onPageChange", async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()

    render(
      <TablePagination
        page={2}
        totalPages={5}
        total={42}
        onPageChange={onPageChange}
      />
    )

    expect(screen.getByText("共 42 条记录，第 2 / 5 页")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "上一页" }))
    expect(onPageChange).toHaveBeenCalledWith(1)

    await user.click(screen.getByRole("button", { name: "下一页" }))
    expect(onPageChange).toHaveBeenCalledWith(3)

    await user.click(screen.getByRole("button", { name: "5" }))
    expect(onPageChange).toHaveBeenCalledWith(5)
  })

  it("disables edge navigation", () => {
    const { rerender } = render(
      <TablePagination
        page={1}
        totalPages={3}
        total={20}
        onPageChange={vi.fn()}
      />
    )

    expect(screen.getByRole("button", { name: "上一页" })).toBeDisabled()

    rerender(
      <TablePagination
        page={3}
        totalPages={3}
        total={20}
        onPageChange={vi.fn()}
      />
    )

    expect(screen.getByRole("button", { name: "下一页" })).toBeDisabled()
  })
})
