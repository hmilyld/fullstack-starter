export type TableDensity = "comfortable" | "compact"

const STORAGE_PREFIX = "table-density:"

function readDensity(tableId: string): TableDensity {
  try {
    const value = window.localStorage.getItem(`${STORAGE_PREFIX}${tableId}`)
    return value === "compact" ? "compact" : "comfortable"
  } catch {
    return "comfortable"
  }
}

/** 表格密度：紧凑 / 舒适，按表记忆 */
export function useTableDensity(tableId: string) {
  let density = $state<TableDensity>(readDensity(tableId))

  function setDensity(next: TableDensity) {
    density = next
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}${tableId}`, next)
    } catch {
      // 隐私模式下不可写，忽略
    }
  }

  return {
    get density() {
      return density
    },
    setDensity,
  }
}
