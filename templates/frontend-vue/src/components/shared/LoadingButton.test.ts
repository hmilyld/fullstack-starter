import { render, screen } from "@testing-library/vue"
import { describe, expect, it } from "vitest"

import LoadingButton from "./LoadingButton.vue"

describe("LoadingButton", () => {
  it("exposes busy state and disables while loading", async () => {
    const { rerender } = render(LoadingButton, {
      slots: { default: "保存" },
    })

    expect(screen.getByRole("button", { name: "保存" })).not.toBeDisabled()

    await rerender({ loading: true })

    expect(screen.getByRole("button", { name: /保存/ })).toBeDisabled()
    expect(screen.getByRole("button", { name: /保存/ })).toHaveAttribute(
      "aria-busy",
      "true"
    )
    // 按钮本身已用 aria-busy 表达状态，内部 spinner 作为装饰不重复播报
    expect(screen.queryByRole("status")).toBeNull()
  })
})
