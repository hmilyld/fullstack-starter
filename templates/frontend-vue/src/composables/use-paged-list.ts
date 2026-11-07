import {
  computed,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
} from "vue"
import type { ApiResponse, PaginatedData } from "@/types/common"

export type ListParams = Record<string, string | number | boolean | undefined>

type UsePagedListOptions<T, P extends ListParams> = {
  /** 传入 api/ 下的分页方法，例如 getUsers */
  fetcher: (
    params: P & { page: number; pageSize: number }
  ) => Promise<ApiResponse<PaginatedData<T>>>
  /** 搜索条件等；值不变时不会因为对象重建而重复请求 */
  params: MaybeRefOrGetter<P>
  pageSize?: number
  /** 受控页码，通常来自 URL 状态 */
  page: MaybeRefOrGetter<number>
  onPageChange: (page: number) => void
}

/**
 * 服务端分页列表的公共状态：加载、错误、页码、总数、刷新。
 * 用递增的请求序号丢弃过期响应，避免快速搜索/翻页时旧数据覆盖新数据。
 */
export function usePagedList<T, P extends ListParams = ListParams>({
  fetcher,
  params,
  pageSize = 10,
  page,
  onPageChange,
}: UsePagedListOptions<T, P>) {
  const items = ref([]) as Ref<T[]>
  const total = ref(0)
  const loading = ref(true)
  const error = ref<string | null>(null)
  let requestId = 0

  const paramsKey = computed(() => JSON.stringify(toValue(params)))
  const currentPage = computed(() => toValue(page))
  const totalPages = computed(() =>
    Math.max(1, Math.ceil(total.value / pageSize))
  )

  async function load() {
    const id = ++requestId
    loading.value = true
    error.value = null
    try {
      const current = JSON.parse(paramsKey.value) as P
      const res = await fetcher({
        ...current,
        page: currentPage.value,
        pageSize,
      })
      if (id !== requestId) return
      if (res.code === 0) {
        items.value = res.data.list
        total.value = res.data.total
      } else {
        error.value = res.message || "加载数据失败"
      }
    } catch (err) {
      if (id === requestId) {
        error.value = (err as Error).message || "加载数据失败"
      }
    } finally {
      if (id === requestId) loading.value = false
    }
  }

  let lastParamsKey = paramsKey.value

  watch(
    [paramsKey, currentPage],
    ([key, nextPage]) => {
      const paramsChanged = key !== lastParamsKey
      lastParamsKey = key

      if (paramsChanged && nextPage !== 1) {
        onPageChange(1)
        return
      }

      void load()
    },
    { immediate: true }
  )

  watch(
    [currentPage, totalPages],
    ([nextPage, nextTotalPages]) => {
      if (nextPage > nextTotalPages) onPageChange(nextTotalPages)
    },
    { immediate: true }
  )

  function refresh() {
    void load()
  }

  return {
    items,
    total,
    page: currentPage,
    pageSize,
    totalPages,
    loading,
    error,
    setPage: onPageChange,
    refresh,
  }
}
