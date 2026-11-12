import { computed, ref } from "vue"

const STORAGE_PREFIX = "table-columns:"

export type ColumnLike = {
  key: string
  hideable?: boolean
  defaultHidden?: boolean
}

function storageKey(tableId: string) {
  return `${STORAGE_PREFIX}${tableId}`
}

function readHidden<T extends ColumnLike>(
  tableId: string,
  columns: T[]
): string[] {
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
  const hidden = ref<string[]>(readHidden(tableId, columns))

  function persist(next: string[]) {
    hidden.value = next
    try {
      window.localStorage.setItem(storageKey(tableId), JSON.stringify(next))
    } catch {
      // 隐私模式下不可写，忽略
    }
  }

  function toggle(key: string) {
    persist(
      hidden.value.includes(key)
        ? hidden.value.filter((value) => value !== key)
        : [...hidden.value, key]
    )
  }

  function reset() {
    persist([])
  }

  const hideableColumns = computed(() =>
    columns.filter((column) => column.hideable)
  )

  const visibleColumns = computed(() =>
    columns.filter((column) => !hidden.value.includes(column.key))
  )

  return { hidden, hideableColumns, visibleColumns, toggle, reset }
}
