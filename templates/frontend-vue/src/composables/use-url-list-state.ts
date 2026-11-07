import { computed } from "vue"
import { useRoute, useRouter } from "vue-router"

export function parsePage(value: unknown): number {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

/** 只读写页码，供审计日志等自带筛选条件的列表使用 */
export function useUrlPage() {
  const route = useRoute()
  const router = useRouter()

  const page = computed(() => parsePage(route.query.page))

  function setPage(value: number) {
    const query = { ...route.query }
    if (value <= 1) delete query.page
    else query.page = String(value)
    void router.replace({ query })
  }

  return { page, setPage }
}

/**
 * 列表页的 URL 状态：q / page。
 * 使用 replace，避免每次输入都污染浏览器历史；返回键仍可跨页面回退。
 */
export function useUrlListState() {
  const route = useRoute()
  const router = useRouter()
  const { page, setPage } = useUrlPage()

  const search = computed(() =>
    typeof route.query.q === "string" ? route.query.q : ""
  )

  function setSearch(value: string) {
    const query = { ...route.query }
    if (value.trim()) query.q = value
    else delete query.q
    delete query.page
    void router.replace({ query })
  }

  return { search, page, setSearch, setPage }
}
