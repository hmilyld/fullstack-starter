import { render, screen } from "@testing-library/vue"
import { describe, expect, it } from "vitest"

import RecordCard from "./RecordCard.vue"

describe("RecordCard", () => {
  it("renders title, subtitle, meta, badges and actions", () => {
    render(RecordCard, {
      props: { title: "张三", subtitle: "zhangsan@example.com" },
      slots: {
        meta: "<span>普通用户</span>",
        badges: "<span>预设</span>",
        actions: '<button type="button">更多</button>',
      },
    })

    expect(screen.getByText("张三")).toBeInTheDocument()
    expect(screen.getByText("zhangsan@example.com")).toBeInTheDocument()
    expect(screen.getByText("普通用户")).toBeInTheDocument()
    expect(screen.getByText("预设")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "更多" })).toBeInTheDocument()
  })
})
