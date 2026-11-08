import { afterEach, describe, expect, it, vi } from "vitest"

import { buildUrl, parseFilename, requestJson, requestRaw } from "./http"

describe("buildUrl", () => {
  it("returns the bare path when there are no params", () => {
    expect(buildUrl("/users")).toBe("/users")
    expect(buildUrl("/users", {})).toBe("/users")
  })

  it("appends defined params and skips empty ones", () => {
    expect(buildUrl("/users", { search: "a", page: 2 })).toBe(
      "/users?search=a&page=2"
    )
    expect(buildUrl("/users", { search: "", page: undefined })).toBe("/users")
  })

  it("keeps boolean false, which is a meaningful filter value", () => {
    expect(buildUrl("/ai-models", { isActive: false })).toBe(
      "/ai-models?isActive=false"
    )
  })
})

describe("parseFilename", () => {
  it("prefers the RFC 5987 filename* form", () => {
    expect(
      parseFilename(
        `attachment; filename="a.zip"; filename*=UTF-8''%E6%95%B0%E6%8D%AE.zip`
      )
    ).toBe("数据.zip")
  })

  it("falls back to the plain filename", () => {
    expect(parseFilename('attachment; filename="backup.sql"')).toBe(
      "backup.sql"
    )
  })

  it("returns the raw value when the name cannot be decoded", () => {
    expect(parseFilename('attachment; filename="100%report.zip"')).toBe(
      "100%report.zip"
    )
  })

  it("returns an empty string when the header is missing", () => {
    expect(parseFilename(null)).toBe("")
    expect(parseFilename("")).toBe("")
  })

  it("returns an empty string when the header has no filename", () => {
    expect(parseFilename("attachment")).toBe("")
  })
})

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe("requestJson", () => {
  it("returns the parsed body on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ code: 0, message: "ok", data: [1] }))
    )

    await expect(requestJson("/users")).resolves.toEqual({
      code: 0,
      message: "ok",
      data: [1],
    })
  })

  it("attaches the bearer token when one is stored", async () => {
    localStorage.setItem("token", "abc")
    const fetchMock = vi.fn(async () =>
      jsonResponse({ code: 0, message: "", data: null })
    )
    vi.stubGlobal("fetch", fetchMock)

    await requestJson("/users")

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer abc"
    )
  })

  it("treats 204 as an empty success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 204 }))
    )

    await expect(requestJson("/auth/logout")).resolves.toEqual({
      code: 0,
      message: "success",
      data: undefined,
    })
  })

  it("surfaces the backend message on a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ message: "权限不足" }, { status: 403 }))
    )

    await expect(requestJson("/users")).resolves.toMatchObject({
      code: -1,
      message: "权限不足",
    })
  })

  it("falls back to detail, then the HTTP status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ detail: "Not Found" }, { status: 404 }))
    )
    await expect(requestJson("/x")).resolves.toMatchObject({
      message: "Not Found",
    })

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("oops", { status: 500 }))
    )
    await expect(requestJson("/x")).resolves.toMatchObject({
      message: "HTTP 500",
    })
  })

  it("normalizes an aborted request instead of rejecting", async () => {
    const abortError = new Error("aborted")
    abortError.name = "AbortError"
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw abortError
      })
    )

    await expect(requestJson("/users")).resolves.toMatchObject({
      code: -1,
      message: "请求已取消",
    })
  })

  it("normalizes a network failure instead of rejecting", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("boom")
      })
    )

    await expect(requestJson("/users")).resolves.toMatchObject({
      code: -1,
      message: "boom",
    })
  })

  it("falls back to the default message for a non-Error rejection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw "boom"
      })
    )

    await expect(requestJson("/users")).resolves.toMatchObject({
      code: -1,
      message: "网络请求失败",
    })
  })

  it("does not reject when reading the token fails", async () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new Error("storage disabled")
    })
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ code: 0, message: "", data: null }))
    )

    await expect(requestJson("/users")).resolves.toMatchObject({ code: -1 })
  })

  it("clears the session and returns an error on 401", async () => {
    localStorage.setItem("token", "abc")
    localStorage.setItem("user", "{}")
    const replace = vi.fn()
    vi.stubGlobal("location", { replace } as unknown as Location)
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ message: "expired" }, { status: 401 }))
    )

    await expect(requestJson("/users")).resolves.toMatchObject({ code: -1 })

    expect(localStorage.getItem("token")).toBeNull()
    expect(localStorage.getItem("user")).toBeNull()
    expect(replace).toHaveBeenCalledWith("/login")
  })
})

describe("requestRaw", () => {
  it("returns the raw response so callers can read headers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("zip", {
            status: 200,
            headers: { "X-Export-Password": "pw" },
          })
      )
    )

    const response = await requestRaw("/data/export", { method: "POST" })

    expect(response.headers.get("X-Export-Password")).toBe("pw")
    await expect(response.text()).resolves.toBe("zip")
  })

  it("throws with the backend message on a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ message: "导出失败" }, { status: 500 }))
    )

    await expect(requestRaw("/data/export")).rejects.toThrow("导出失败")
  })

  it("falls back to detail, then the HTTP status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ detail: "Bad Gateway" }, { status: 502 })
      )
    )
    await expect(requestRaw("/data/export")).rejects.toThrow("Bad Gateway")

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("oops", { status: 503 }))
    )
    await expect(requestRaw("/data/export")).rejects.toThrow("HTTP 503")
  })

  it("throws on 401 after clearing the session", async () => {
    localStorage.setItem("token", "abc")
    vi.stubGlobal("location", { replace: vi.fn() } as unknown as Location)
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ message: "expired" }, { status: 401 }))
    )

    await expect(requestRaw("/data/export")).rejects.toThrow(
      "未登录或登录已过期"
    )
    expect(localStorage.getItem("token")).toBeNull()
  })
})
