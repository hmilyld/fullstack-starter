import { flushPromises } from "@vue/test-utils"
import { effectScope, nextTick, ref } from "vue"
import { describe, expect, it, vi } from "vitest"
import type { ApiResponse, PaginatedData } from "@/types/common"
import { usePagedList } from "./use-paged-list"

type Item = { id: string }

function page(
  items: Item[],
  total = items.length
): ApiResponse<PaginatedData<Item>> {
  return {
    code: 0,
    message: "success",
    data: { list: items, total, page: 1, pageSize: 10 },
  }
}

function setup(fetcher: ReturnType<typeof vi.fn>) {
  const params = ref({ search: "" })
  const pageNumber = ref(1)
  const onPageChange = vi.fn((value: number) => {
    pageNumber.value = value
  })

  const scope = effectScope()
  let list!: ReturnType<typeof usePagedList<Item, { search: string }>>

  scope.run(() => {
    list = usePagedList<Item, { search: string }>({
      fetcher: fetcher as never,
      params,
      pageSize: 10,
      page: pageNumber,
      onPageChange,
    })
  })

  return { scope, list, params, pageNumber, onPageChange }
}

describe("usePagedList", () => {
  it("loads the first page", async () => {
    const fetcher = vi.fn().mockResolvedValue(page([{ id: "1" }]))
    const { scope, list } = setup(fetcher)

    await flushPromises()

    expect(fetcher).toHaveBeenCalledWith({ search: "", page: 1, pageSize: 10 })
    expect(list.items.value).toEqual([{ id: "1" }])
    expect(list.total.value).toBe(1)
    expect(list.totalPages.value).toBe(1)
    expect(list.loading.value).toBe(false)

    scope.stop()
  })

  it("resets to page 1 when params change", async () => {
    const fetcher = vi.fn().mockResolvedValue(page([]))
    const { scope, list, params, pageNumber, onPageChange } = setup(fetcher)

    await flushPromises()
    pageNumber.value = 3
    await nextTick()
    await flushPromises()
    fetcher.mockClear()

    params.value = { search: "张" }
    await nextTick()
    await flushPromises()

    expect(onPageChange).toHaveBeenCalledWith(1)
    expect(fetcher).toHaveBeenLastCalledWith({
      search: "张",
      page: 1,
      pageSize: 10,
    })
    expect(list.error.value).toBeNull()

    scope.stop()
  })

  it("discards stale responses", async () => {
    let resolveFirst: (value: unknown) => void = () => {}
    const first = new Promise((resolve) => {
      resolveFirst = resolve
    })
    const fetcher = vi
      .fn()
      .mockImplementationOnce(() => first)
      .mockResolvedValueOnce(page([{ id: "new" }]))

    const { scope, list, params } = setup(fetcher)
    await nextTick()
    params.value = { search: "next" }
    await nextTick()
    await flushPromises()

    resolveFirst(page([{ id: "old" }]))
    await flushPromises()

    expect(list.items.value).toEqual([{ id: "new" }])
    scope.stop()
  })

  it("exposes API errors and refresh", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({
        code: -1,
        message: "加载失败",
        data: { list: [], total: 0 },
      })
      .mockResolvedValueOnce(page([{ id: "2" }]))

    const { scope, list } = setup(fetcher)
    await flushPromises()
    expect(list.error.value).toBe("加载失败")

    list.refresh()
    await flushPromises()
    expect(list.error.value).toBeNull()
    expect(list.items.value).toEqual([{ id: "2" }])

    scope.stop()
  })
})
