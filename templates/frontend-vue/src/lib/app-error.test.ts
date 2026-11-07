import { describe, expect, it } from "vitest"
import { appError, clearAppError, setAppError } from "./app-error"

describe("app-error", () => {
  it("stores a readable error message", () => {
    setAppError(new Error("组件渲染失败"))
    expect(appError.value).toBe("组件渲染失败")

    clearAppError()
    expect(appError.value).toBeNull()
  })

  it("falls back for non-Error values", () => {
    setAppError("network down")
    expect(appError.value).toBe("页面加载失败，请刷新后重试。")
    clearAppError()
  })
})
