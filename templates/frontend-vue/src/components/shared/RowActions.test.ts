import { render, screen } from "@testing-library/vue"
import userEvent from "@testing-library/user-event"
import { Pencil } from "@lucide/vue"
import { describe, expect, it, vi } from "vitest"

import RowActions from "./RowActions.vue"

describe("RowActions", () => {
  it("opens the menu and runs the selected action", async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()

    render(RowActions, {
      props: {
        actions: [
          { label: "编辑", icon: Pencil, onSelect: onEdit },
          { label: "删除", destructive: true, onSelect: vi.fn() },
        ],
      },
    })

    await user.click(screen.getByRole("button", { name: "更多操作" }))

    const editItem = await screen.findByRole("menuitem", { name: "编辑" })
    await user.click(editItem)

    expect(onEdit).toHaveBeenCalledTimes(1)
  })
})
