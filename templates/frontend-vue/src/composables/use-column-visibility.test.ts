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
    const table = useColumnVisibility("t1", columns)
    expect(table.hidden.value).toEqual(["phone"])
    expect(table.visibleColumns.value.map((column) => column.key)).toEqual([
      "name",
      "email",
      "actions",
    ])
    expect(table.hideableColumns.value).toHaveLength(2)
  })

  it("切换后写入 localStorage，重新挂载时恢复", () => {
    const first = useColumnVisibility("t2", columns)
    first.toggle("email")
    expect(first.hidden.value).toContain("email")

    const second = useColumnVisibility("t2", columns)
    expect(second.hidden.value).toContain("email")
  })

  it("重置回到默认隐藏状态，而不是全部显示", () => {
    const first = useColumnVisibility("t3", columns)
    first.toggle("email")
    expect(first.hidden.value).toEqual(["phone", "email"])

    first.reset()
    expect(first.hidden.value).toEqual(["phone"])
    expect(window.localStorage.getItem("table-columns:t3")).toBeNull()

    const second = useColumnVisibility("t3", columns)
    expect(second.hidden.value).toEqual(["phone"])
  })

  it("忽略存储中已不存在的列 key", () => {
    window.localStorage.setItem(
      "table-columns:t4",
      JSON.stringify(["email", "removed", 42])
    )
    const table = useColumnVisibility("t4", columns)
    expect(table.hidden.value).toEqual(["email"])
  })
})
