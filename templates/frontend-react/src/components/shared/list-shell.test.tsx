import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ListShell } from "./list-shell"

describe("ListShell", () => {
  it("renders description, actions, children and footer without a duplicated title", () => {
    render(
      <ListShell
        description="共 3 位用户"
        actions={<button type="button">筛选</button>}
        footer={<span>分页</span>}
      >
        <span>表格内容</span>
      </ListShell>
    )

    expect(screen.getByText("共 3 位用户")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "筛选" })).toBeInTheDocument()
    expect(screen.getByText("表格内容")).toBeInTheDocument()
    expect(screen.getByText("分页")).toBeInTheDocument()
    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
  })

  it("works without a toolbar", () => {
    render(
      <ListShell>
        <span>只有内容</span>
      </ListShell>
    )
    expect(screen.getByText("只有内容")).toBeInTheDocument()
  })
})
