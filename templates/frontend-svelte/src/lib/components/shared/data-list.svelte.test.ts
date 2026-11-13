import { describe, expect, it } from "vitest"
import { page } from "vitest/browser"
import { render } from "vitest-browser-svelte"

import DataList from "./data-list.svelte"

const baseProps = {
  loading: false,
  error: null,
  columns: [],
  empty: { title: "暂无数据", description: "创建第一条记录" },
  onRetry: () => {},
  onHideColumn: () => {},
}

describe("DataList", () => {
  it("renders the empty state", async () => {
    render(DataList, { ...baseProps, items: [] })

    await expect.element(page.getByText("暂无数据")).toBeInTheDocument()
    await expect.element(page.getByText("创建第一条记录")).toBeInTheDocument()
  })

  it("renders column headers for a non-empty list", async () => {
    await page.viewport(1280, 800)
    render(DataList, {
      ...baseProps,
      items: [{ id: "1" }],
      columns: [{ key: "name", header: "姓名" }],
    })

    await expect.element(page.getByText("姓名")).toBeInTheDocument()
  })
})
