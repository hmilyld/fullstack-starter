import * as React from "react"
import { useSearchParams } from "react-router"

export function parsePage(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

type SearchParamsSetter = ReturnType<typeof useSearchParams>[1]

function writePage(setSearchParams: SearchParamsSetter, value: number) {
  setSearchParams(
    (current) => {
      const next = new URLSearchParams(current)
      if (value <= 1) next.delete("page")
      else next.set("page", String(value))
      return next
    },
    { replace: true }
  )
}

/** 只读写页码，供审计日志等自带筛选条件的列表使用 */
export function useUrlPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parsePage(searchParams.get("page"))
  const setPage = React.useCallback(
    (value: number) => writePage(setSearchParams, value),
    [setSearchParams]
  )

  return { page, setPage }
}

/**
 * 列表页的 URL 状态：q / page。
 * 使用 replace，避免每次输入都污染浏览器历史；返回键仍可跨页面回退。
 */
export function useUrlListState() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { page, setPage } = useUrlPage()
  const search = searchParams.get("q") ?? ""

  const setSearch = React.useCallback(
    (value: string) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (value.trim()) next.set("q", value)
          else next.delete("q")
          next.delete("page")
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  return { search, page, setSearch, setPage }
}
