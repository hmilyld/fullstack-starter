import { goto } from "$app/navigation"
import { page } from "$app/state"

export function parsePage(value: unknown): number {
  const pageNumber = Number(value)
  return Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1
}

function navigate(mutate: (url: URL) => void) {
  const url = new URL(page.url.href)
  mutate(url)
  void goto(url, { replace: true, reset: false })
}

/** 只读写页码，供审计日志等自带筛选条件的列表使用 */
export function useUrlPage() {
  const currentPage = $derived(parsePage(page.url.searchParams.get("page")))

  function setPage(value: number) {
    navigate((url) => {
      if (value <= 1) url.searchParams.delete("page")
      else url.searchParams.set("page", String(value))
    })
  }

  return {
    get page() {
      return currentPage
    },
    setPage,
  }
}

/**
 * 列表页的 URL 状态：q / page。
 * 使用 replace，避免每次输入都污染浏览器历史；返回键仍可跨页面回退。
 */
export function useUrlListState() {
  const urlState = useUrlPage()
  const search = $derived(page.url.searchParams.get("q") ?? "")

  function setSearch(value: string) {
    navigate((url) => {
      if (value.trim()) url.searchParams.set("q", value)
      else url.searchParams.delete("q")
      url.searchParams.delete("page")
    })
  }

  return {
    get search() {
      return search
    },
    get page() {
      return urlState.page
    },
    setSearch,
    setPage: urlState.setPage,
  }
}
