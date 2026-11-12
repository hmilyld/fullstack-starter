import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { DataList, type DataColumn } from "./data-list"

type Row = { id: string; name: string; email: string }

const items: Row[] = [{ id: "1", name: "张三", email: "z@example.com" }]

const columns: DataColumn<Row>[] = [
  { key: "name", header: "姓名", cell: (item) => item.name },
  {
    key: "email",
    header: "邮箱",
    hideable: true,
    cell: (item) => item.email,
  },
]

function renderList(options: {
  items?: Row[]
  loading?: boolean
  error?: string | null
  cols?: DataColumn<Row>[]
}) {
  const {
    items: rows = [],
    loading = false,
    error = null,
    cols = columns,
  } = options
  return render(
    <DataList<Row>
      items={rows}
      loading={loading}
      error={error}
      onRetry={vi.fn()}
      empty={{ title: "还没有数据" }}
      getKey={(item) => item.id}
      renderCard={(item) => <div>卡片 {item.name}</div>}
      columns={cols}
    />
  )
}

describe("DataList", () => {
  it("加载中只显示骨架", () => {
    renderList({ loading: true })
    expect(
      screen.queryByRole("columnheader", { name: "姓名" })
    ).not.toBeInTheDocument()
  })

  it("空数据显示 EmptyState", () => {
    renderList({})
    expect(screen.getByText("还没有数据")).toBeInTheDocument()
  })

  it("有数据时渲染卡片与表格，并按列定义输出表头与单元格", () => {
    renderList({ items })
    expect(screen.getByText("卡片 张三")).toBeInTheDocument()
    const table = screen.getByRole("table")
    expect(within(table).getByText("z@example.com")).toBeInTheDocument()
    expect(
      within(table).getByRole("columnheader", { name: "邮箱" })
    ).toBeInTheDocument()
  })

  it("列定义被过滤后不再渲染该列", () => {
    renderList({ items, cols: columns.filter((c) => c.key !== "email") })
    const table = screen.getByRole("table")
    expect(within(table).queryByText("z@example.com")).not.toBeInTheDocument()
  })

  it("有数据且请求失败时显示行内错误", () => {
    renderList({ items, error: "加载失败" })
    expect(screen.getByText("加载失败")).toBeInTheDocument()
    expect(screen.getByText("卡片 张三")).toBeInTheDocument()
  })
})
