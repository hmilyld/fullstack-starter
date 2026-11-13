const STORAGE_PREFIX = "table-columns:"

export type ColumnLike = {
  key: string
  hideable?: boolean
  defaultHidden?: boolean
}

function storageKey(tableId: string) {
  return `${STORAGE_PREFIX}${tableId}`
}

/** 没有存储值时使用的默认隐藏列 */
function defaultHiddenKeys(columns: ColumnLike[]): string[] {
  return columns
    .filter((column) => column.hideable && column.defaultHidden)
    .map((column) => column.key)
}

function readHidden(tableId: string, columns: ColumnLike[]): string[] {
  const hideable = new Set(
    columns.filter((column) => column.hideable).map((column) => column.key)
  )
  try {
    const raw = window.localStorage.getItem(storageKey(tableId))
    if (!raw) return defaultHiddenKeys(columns)
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
  columns: () => T[]
) {
  let hidden = $state<string[]>(readHidden(tableId, columns()))

  function persist(next: string[]) {
    hidden = next
    try {
      window.localStorage.setItem(storageKey(tableId), JSON.stringify(next))
    } catch {
      // 隐私模式下不可写，忽略
    }
  }

  function toggle(key: string) {
    persist(
      hidden.includes(key)
        ? hidden.filter((value) => value !== key)
        : [...hidden, key]
    )
  }

  // 回到「没有存储值」的状态：默认隐藏的列重新隐藏，而不是全部显示
  function reset() {
    try {
      window.localStorage.removeItem(storageKey(tableId))
    } catch {
      // 隐私模式下不可写，忽略
    }
    hidden = defaultHiddenKeys(columns())
  }

  const hideableColumns = $derived(
    columns().filter((column) => column.hideable)
  )

  const visibleColumns = $derived(
    columns().filter((column) => !hidden.includes(column.key))
  )

  return {
    get hidden() {
      return hidden
    },
    get hideableColumns() {
      return hideableColumns
    },
    get visibleColumns() {
      return visibleColumns
    },
    toggle,
    reset,
  }
}
