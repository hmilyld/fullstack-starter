import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ListShell } from "./list-shell"

describe("ListShell", () => {
  it("renders title, description, actions, children and footer", () => {
    render(
      <ListShell
        title="用户列表"
        description="共 3 位用户"
        actions={<button type="button">筛选</button>}
        footer={<span>分页</span>}
      >
        <span>表格内容</span>
      </ListShell>
    )

    expect(screen.getByText("用户列表")).toBeInTheDocument()
    expect(screen.getByText("共 3 位用户")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "筛选" })).toBeInTheDocument()
    expect(screen.getByText("表格内容")).toBeInTheDocument()
    expect(screen.getByText("分页")).toBeInTheDocument()
  })
})
