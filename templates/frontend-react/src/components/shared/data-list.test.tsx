import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { DataList } from "./data-list"

type Row = { id: string; name: string }

const items: Row[] = [{ id: "1", name: "张三" }]

function renderList(options: {
  items?: Row[]
  loading?: boolean
  error?: string | null
}) {
  const { items: rows = [], loading = false, error = null } = options
  return render(
    <DataList<Row>
      items={rows}
      loading={loading}
      error={error}
      onRetry={vi.fn()}
      empty={{ title: "还没有数据" }}
      getKey={(item) => item.id}
      renderCard={(item) => <div>{item.name}</div>}
    >
      <table>
        <tbody>
          <tr>
            <td>表格行</td>
          </tr>
        </tbody>
      </table>
    </DataList>
  )
}

describe("DataList", () => {
  it("加载中显示骨架，不渲染表格", () => {
    renderList({ loading: true })
    expect(screen.queryByText("表格行")).not.toBeInTheDocument()
  })

  it("空数据显示 EmptyState", () => {
    renderList({})
    expect(screen.getByText("还没有数据")).toBeInTheDocument()
  })

  it("有数据时渲染卡片与表格", () => {
    renderList({ items })
    expect(screen.getByText("张三")).toBeInTheDocument()
    expect(screen.getByText("表格行")).toBeInTheDocument()
  })

  it("有数据且请求失败时显示行内错误", () => {
    renderList({ items, error: "加载失败" })
    expect(screen.getByText("加载失败")).toBeInTheDocument()
    expect(screen.getByText("张三")).toBeInTheDocument()
  })
})
