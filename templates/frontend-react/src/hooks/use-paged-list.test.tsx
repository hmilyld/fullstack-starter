import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { ApiResponse, PaginatedData } from "@/types/common"
import { usePagedList } from "./use-paged-list"

type Item = { id: string }
type Params = { search: string }
type Response = ApiResponse<PaginatedData<Item>>

function response(page: number, total = 25): Response {
  return {
    code: 0,
    message: "success",
    data: {
      list: [{ id: String(page) }],
      total,
      page,
      pageSize: 8,
    },
  }
}

describe("usePagedList", () => {
  it("loads the first page and exposes totals", async () => {
    const fetcher = vi.fn(
      async (params: Params & { page: number; pageSize: number }) =>
        response(params.page)
    )

    const { result } = renderHook(() =>
      usePagedList<Item, Params>({
        fetcher,
        params: { search: "" },
        pageSize: 8,
      })
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(fetcher).toHaveBeenCalledWith({
      search: "",
      page: 1,
      pageSize: 8,
    })
    expect(result.current.items).toEqual([{ id: "1" }])
    expect(result.current.total).toBe(25)
    expect(result.current.totalPages).toBe(4)
  })

  it("loads the next page when page changes", async () => {
    const fetcher = vi.fn(
      async (params: Params & { page: number; pageSize: number }) =>
        response(params.page)
    )

    const { result } = renderHook(() =>
      usePagedList<Item, Params>({
        fetcher,
        params: { search: "" },
        pageSize: 8,
      })
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.setPage(2))

    await waitFor(() =>
      expect(fetcher).toHaveBeenLastCalledWith({
        search: "",
        page: 2,
        pageSize: 8,
      })
    )
    expect(result.current.page).toBe(2)
  })

  it("resets to page 1 when params change", async () => {
    const fetcher = vi.fn(
      async (params: Params & { page: number; pageSize: number }) =>
        response(params.page)
    )

    const { result, rerender } = renderHook(
      ({ search }: Params) =>
        usePagedList<Item, Params>({
          fetcher,
          params: { search },
          pageSize: 8,
        }),
      { initialProps: { search: "" } }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => result.current.setPage(2))
    await waitFor(() => expect(result.current.page).toBe(2))

    rerender({ search: "x" })

    await waitFor(() =>
      expect(fetcher).toHaveBeenLastCalledWith({
        search: "x",
        page: 1,
        pageSize: 8,
      })
    )
    expect(result.current.page).toBe(1)
  })

  it("supports a controlled page from URL state", async () => {
    const fetcher = vi.fn(
      async (params: Params & { page: number; pageSize: number }) =>
        response(params.page)
    )
    const onPageChange = vi.fn()

    const { result, rerender } = renderHook(
      ({ page }: { page: number }) =>
        usePagedList<Item, Params>({
          fetcher,
          params: { search: "" },
          pageSize: 8,
          page,
          onPageChange,
        }),
      { initialProps: { page: 1 } }
    )

    await waitFor(() =>
      expect(fetcher).toHaveBeenLastCalledWith({
        search: "",
        page: 1,
        pageSize: 8,
      })
    )

    rerender({ page: 2 })
    await waitFor(() =>
      expect(fetcher).toHaveBeenLastCalledWith({
        search: "",
        page: 2,
        pageSize: 8,
      })
    )

    act(() => result.current.setPage(3))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it("surfaces API errors", async () => {
    const fetcher = vi.fn(async (): Promise<Response> => ({
      code: -1,
      message: "加载失败",
      data: undefined as unknown as PaginatedData<Item>,
    }))

    const { result } = renderHook(() =>
      usePagedList<Item, Params>({
        fetcher,
        params: { search: "" },
        pageSize: 8,
      })
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe("加载失败")
    expect(result.current.items).toEqual([])
  })
})
