import type {
  ApiResponse,
  PaginatedData,
  QueryParams,
} from "#lib/types/common.js"

export type ListParams = QueryParams

type UsePagedListOptions<T, P extends ListParams> = {
  /** 传入 api/ 下的分页方法，例如 getUsers */
  fetcher: (
    params: P & { page: number; pageSize: number }
  ) => Promise<ApiResponse<PaginatedData<T>>>
  /** 搜索条件等；值不变时不会因为对象重建而重复请求 */
  params: () => P
  pageSize?: () => number
  /** 受控页码，通常来自 URL 状态 */
  page: () => number
  onPageChange: (page: number) => void
}

/**
 * 服务端分页列表的公共状态：加载、错误、页码、总数、刷新。
 * 用递增的请求序号丢弃过期响应，避免快速搜索/翻页时旧数据覆盖新数据。
 */
export function usePagedList<T, P extends ListParams = ListParams>({
  fetcher,
  params,
  pageSize,
  page: pageSource,
  onPageChange,
}: UsePagedListOptions<T, P>) {
  let items = $state<T[]>([])
  let total = $state(0)
  let loading = $state(true)
  let error = $state<string | null>(null)
  let requestId = 0

  const paramsKey = $derived(JSON.stringify(params()))
  const currentPage = $derived(pageSource())
  const currentPageSize = $derived(pageSize?.() ?? 10)
  const totalPages = $derived(Math.max(1, Math.ceil(total / currentPageSize)))

  async function load() {
    const id = ++requestId
    loading = true
    error = null
    try {
      const current = JSON.parse(paramsKey) as P
      const res = await fetcher({
        ...current,
        page: currentPage,
        pageSize: currentPageSize,
      })
      if (id !== requestId) return
      if (res.code === 0) {
        items = res.data.list
        total = res.data.total
      } else {
        error = res.message || "加载数据失败"
      }
    } catch (err) {
      if (id === requestId) {
        error = (err as Error).message || "加载数据失败"
      }
    } finally {
      if (id === requestId) loading = false
    }
  }

  let lastParamsKey = paramsKey

  $effect(() => {
    const key = paramsKey
    const nextPage = currentPage
    const nextPageSize = currentPageSize
    void nextPageSize
    const paramsChanged = key !== lastParamsKey
    lastParamsKey = key

    if (paramsChanged && nextPage !== 1) {
      onPageChange(1)
      return
    }

    void load()
  })

  $effect(() => {
    if (currentPage > totalPages) onPageChange(totalPages)
  })

  return {
    get items() {
      return items
    },
    get total() {
      return total
    },
    get page() {
      return currentPage
    },
    get pageSize() {
      return currentPageSize
    },
    get totalPages() {
      return totalPages
    },
    get loading() {
      return loading
    },
    get error() {
      return error
    },
    setPage: onPageChange,
    refresh: () => void load(),
  }
}
