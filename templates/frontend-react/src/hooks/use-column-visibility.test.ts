import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import { useColumnVisibility } from "./use-column-visibility"

const columns = [
  { key: "name" },
  { key: "email", hideable: true },
  { key: "phone", hideable: true, defaultHidden: true },
  { key: "actions" },
]

describe("useColumnVisibility", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("默认隐藏 defaultHidden 的列，不可隐藏列永远可见", () => {
    const { result } = renderHook(() => useColumnVisibility("t1", columns))
    expect(result.current.hidden).toEqual(["phone"])
    expect(result.current.visibleColumns.map((c) => c.key)).toEqual([
      "name",
      "email",
      "actions",
    ])
    expect(result.current.hideableColumns).toHaveLength(2)
  })

  it("切换后写入 localStorage，重新挂载时恢复", () => {
    const first = renderHook(() => useColumnVisibility("t2", columns))
    act(() => first.result.current.toggle("email"))
    expect(first.result.current.hidden).toContain("email")

    const second = renderHook(() => useColumnVisibility("t2", columns))
    expect(second.result.current.hidden).toContain("email")
  })

  it("重置清空隐藏状态（含默认隐藏列）", () => {
    const { result } = renderHook(() => useColumnVisibility("t3", columns))
    act(() => result.current.reset())
    expect(result.current.hidden).toEqual([])
  })

  it("忽略存储中已不存在的列 key", () => {
    window.localStorage.setItem(
      "table-columns:t4",
      JSON.stringify(["email", "removed", 42])
    )
    const { result } = renderHook(() => useColumnVisibility("t4", columns))
    expect(result.current.hidden).toEqual(["email"])
  })
})
