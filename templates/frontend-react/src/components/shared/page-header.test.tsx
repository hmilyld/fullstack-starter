import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PageHeader } from "./page-header"

describe("PageHeader", () => {
  it("renders title, description and actions", () => {
    render(
      <PageHeader
        title="用户管理"
        description="管理团队成员"
        actions={<button type="button">新增</button>}
      />
    )

    expect(
      screen.getByRole("heading", { level: 1, name: "用户管理" })
    ).toBeInTheDocument()
    expect(screen.getByText("管理团队成员")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "新增" })).toBeInTheDocument()
  })
})
