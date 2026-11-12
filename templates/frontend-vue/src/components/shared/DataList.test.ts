import { render, screen } from "@testing-library/vue"
import { h } from "vue"
import { describe, expect, it } from "vitest"

import DataList from "./DataList.vue"

type Row = { id: string; name: string; email: string }

const columns = [
  { key: "name", header: "姓名" },
  { key: "email", header: "邮箱", hideable: true },
]

const items: Row[] = [{ id: "1", name: "张三", email: "z@example.com" }]

type Props = {
  items?: Row[]
  loading?: boolean
  error?: string | null
  cols?: typeof columns
}

function mountList({
  items: rows = [],
  loading = false,
  error = null,
  cols = columns,
}: Props) {
  return render(DataList, {
    props: {
      items: rows,
      loading,
      error,
      columns: cols,
      empty: { title: "还没有数据" },
      skeletonColSpan: 2,
    },
    slots: {
      "cell-name": ({ row }: { row: Row }) => h("span", row.name),
      "cell-email": ({ row }: { row: Row }) => h("span", row.email),
      card: ({ row }: { row: Row }) => h("div", `卡片 ${row.name}`),
    },
  })
}

describe("DataList", () => {
  it("加载中只显示骨架，不渲染列头", () => {
    mountList({ loading: true })
    expect(
      screen.queryByRole("columnheader", { name: "姓名" })
    ).not.toBeInTheDocument()
  })

  it("空数据显示 EmptyState", () => {
    mountList({})
    expect(screen.getByText("还没有数据")).toBeInTheDocument()
  })

  it("有数据时渲染卡片与列定义的表格", () => {
    mountList({ items })
    expect(screen.getByText("卡片 张三")).toBeInTheDocument()
    expect(screen.getByText("z@example.com")).toBeInTheDocument()
    expect(
      screen.getByRole("columnheader", { name: "邮箱" })
    ).toBeInTheDocument()
  })

  it("过滤后的列定义不再渲染该列", () => {
    mountList({
      items,
      cols: columns.filter((column) => column.key !== "email"),
    })
    expect(screen.queryByText("z@example.com")).not.toBeInTheDocument()
  })

  it("有数据且请求失败时显示行内错误", () => {
    mountList({ items, error: "加载失败" })
    expect(screen.getByText("加载失败")).toBeInTheDocument()
    expect(screen.getByText("卡片 张三")).toBeInTheDocument()
  })
})
