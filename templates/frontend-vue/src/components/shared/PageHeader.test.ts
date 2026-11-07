import { render, screen } from "@testing-library/vue"
import { describe, expect, it } from "vitest"

import PageHeader from "./PageHeader.vue"

describe("PageHeader", () => {
  it("renders title, description and actions", () => {
    render(PageHeader, {
      props: { title: "用户管理", description: "管理团队成员" },
      slots: { actions: '<button type="button">新增</button>' },
    })

    expect(
      screen.getByRole("heading", { level: 1, name: "用户管理" })
    ).toBeInTheDocument()
    expect(screen.getByText("管理团队成员")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "新增" })).toBeInTheDocument()
  })
})
