import { render, screen } from "@testing-library/react"
import { SearchXIcon } from "lucide-react"
import { describe, expect, it } from "vitest"

import { EmptyState } from "./empty-state"

describe("EmptyState", () => {
  it("renders title, description and action", () => {
    render(
      <EmptyState
        icon={SearchXIcon}
        title="没有匹配的用户"
        description="换个关键词试试"
        action={<button type="button">清空搜索</button>}
      />
    )

    expect(screen.getByText("没有匹配的用户")).toBeInTheDocument()
    expect(screen.getByText("换个关键词试试")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "清空搜索" })).toBeInTheDocument()
  })
})
