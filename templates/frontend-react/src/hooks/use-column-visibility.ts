import * as React from "react"

const STORAGE_PREFIX = "table-columns:"

export type ColumnLike = {
  key: string
  hideable?: boolean
  defaultHidden?: boolean
}

function storageKey(tableId: string) {
  return `${STORAGE_PREFIX}${tableId}`
}

function readHidden(tableId: string, columns: ColumnLike[]): string[] {
  const hideable = new Set(
    columns.filter((column) => column.hideable).map((column) => column.key)
  )
  try {
    const raw = window.localStorage.getItem(storageKey(tableId))
    if (!raw) {
      return columns
        .filter((column) => column.hideable && column.defaultHidden)
        .map((column) => column.key)
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (value): value is string =>
        typeof value === "string" && hideable.has(value)
    )
  } catch {
    return []
  }
}

/**
 * 表格列显隐：不可隐藏的列（如名称、操作）永远显示，
 * 状态按 tableId 存在 localStorage，刷新后保持。
 */
export function useColumnVisibility<T extends ColumnLike>(
  tableId: string,
  columns: T[]
) {
  const [hidden, setHidden] = React.useState<string[]>(() =>
    readHidden(tableId, columns)
  )

  const persist = React.useCallback(
    (next: string[]) => {
      setHidden(next)
      try {
        window.localStorage.setItem(storageKey(tableId), JSON.stringify(next))
      } catch {
        // 隐私模式下不可写，忽略
      }
    },
    [tableId]
  )

  const toggle = React.useCallback(
    (key: string) => {
      persist(
        hidden.includes(key)
          ? hidden.filter((value) => value !== key)
          : [...hidden, key]
      )
    },
    [hidden, persist]
  )

  const reset = React.useCallback(() => {
    persist([])
  }, [persist])

  const hideableColumns = React.useMemo(
    () => columns.filter((column) => column.hideable),
    [columns]
  )
  const visibleColumns = React.useMemo(
    () => columns.filter((column) => !hidden.includes(column.key)),
    [columns, hidden]
  )

  return { hidden, hideableColumns, visibleColumns, toggle, reset }
}
