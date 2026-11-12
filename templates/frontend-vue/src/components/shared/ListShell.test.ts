import { render, screen } from "@testing-library/vue"
import { describe, expect, it } from "vitest"

import ListShell from "./ListShell.vue"

describe("ListShell", () => {
  it("renders description, actions, children and footer without a duplicated title", () => {
    render(ListShell, {
      props: { description: "共 3 位用户" },
      slots: {
        actions: '<button type="button">筛选</button>',
        default: "<span>表格内容</span>",
        footer: "<span>分页</span>",
      },
    })

    expect(screen.getByText("共 3 位用户")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "筛选" })).toBeInTheDocument()
    expect(screen.getByText("表格内容")).toBeInTheDocument()
    expect(screen.getByText("分页")).toBeInTheDocument()
    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
  })

  it("works without a toolbar", () => {
    render(ListShell, { slots: { default: "<span>只有内容</span>" } })
    expect(screen.getByText("只有内容")).toBeInTheDocument()
  })
})
