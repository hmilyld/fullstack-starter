import * as React from "react"

import type { ApiResponse, PaginatedData } from "@/types/common"

export type ListParams = Record<string, string | number | boolean | undefined>

type UsePagedListOptions<T, P extends ListParams> = {
  /** 传入 api/ 下的分页方法，例如 getUsers */
  fetcher: (
    params: P & { page: number; pageSize: number }
  ) => Promise<ApiResponse<PaginatedData<T>>>
  /** 搜索条件等；对象引用变化但值不变时不会触发请求 */
  params: P
  pageSize?: number
  /** 受控页码；传入时通常配合 onPageChange 使用（例如 URL 状态） */
  page?: number
  /** 受控页码变更回调；未传时使用内部状态 */
  onPageChange?: (page: number) => void
}

/**
 * 服务端分页列表的公共状态：加载、错误、页码、总数、刷新。
 * 用递增的请求序号丢弃过期响应，避免快速搜索/翻页时旧数据覆盖新数据。
 */
export function usePagedList<T, P extends ListParams = ListParams>({
  fetcher,
  params,
  pageSize = 10,
  page: pageProp,
  onPageChange,
}: UsePagedListOptions<T, P>) {
  const [items, setItems] = React.useState<T[]>([])
  const [total, setTotal] = React.useState(0)
  const [internalPage, setInternalPage] = React.useState(1)
  const page = pageProp ?? internalPage
  const setPage = onPageChange ?? setInternalPage
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const paramsKey = JSON.stringify(params)

  const fetcherRef = React.useRef(fetcher)
  React.useEffect(() => {
    fetcherRef.current = fetcher
  })

  const requestId = React.useRef(0)

  const load = React.useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const current = JSON.parse(paramsKey) as P
      const res = await fetcherRef.current({ ...current, page, pageSize })
      if (id !== requestId.current) return
      if (res.code === 0) {
        setItems(res.data.list)
        setTotal(res.data.total)
      } else {
        setError(res.message || "加载数据失败")
      }
    } catch (err) {
      if (id === requestId.current) {
        setError((err as Error).message || "加载数据失败")
      }
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [paramsKey, page, pageSize])

  const paramsKeyRef = React.useRef(paramsKey)

  React.useEffect(() => {
    if (paramsKeyRef.current !== paramsKey) {
      paramsKeyRef.current = paramsKey
      if (page !== 1) {
        setPage(1)
        return
      }
    }
    void load()
  }, [paramsKey, page, load, setPage])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages, setPage])

  const loadRef = React.useRef(load)
  React.useEffect(() => {
    loadRef.current = load
  })

  const refresh = React.useCallback(() => {
    void loadRef.current()
  }, [])

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    loading,
    error,
    setPage,
    refresh,
  }
}
