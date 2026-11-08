import { afterEach, describe, expect, it, vi } from "vitest"

import { saveBlob } from "./download"

/**
 * vitest.config.ts 开启了 restoreMocks，spyOn 会在每个用例后自动还原；
 * 假定时器需要手动还原，否则会泄漏到同文件的后续用例。
 */
afterEach(() => {
  vi.useRealTimers()
})

describe("saveBlob", () => {
  it("triggers a download and releases the object URL afterwards", () => {
    vi.useFakeTimers()
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock")
    const revokeObjectURL = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {})

    const click = vi.fn()
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, "createElement").mockImplementation(
      (tag: string, options?: ElementCreationOptions) => {
        const element = createElement(tag, options)
        if (tag === "a") element.click = click
        return element
      }
    )

    saveBlob(new Blob(["x"]), "export.zip")

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).not.toHaveBeenCalled()

    vi.runAllTimers()

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock")
  })
})

describe("stub hygiene", () => {
  it("restores URL.createObjectURL after the previous test", () => {
    expect(vi.isMockFunction(URL.createObjectURL)).toBe(false)
  })
})
