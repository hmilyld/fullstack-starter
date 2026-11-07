import { effectScope, nextTick, ref } from "vue"
import { describe, expect, it, vi } from "vitest"
import { useDebouncedValue } from "./use-debounced-value"

describe("useDebouncedValue", () => {
  it("only updates after the delay", async () => {
    vi.useFakeTimers()
    const scope = effectScope()
    const source = ref("a")
    let debounced!: ReturnType<typeof useDebouncedValue<string>>

    scope.run(() => {
      debounced = useDebouncedValue(source, 300)
    })

    source.value = "ab"
    await nextTick()
    expect(debounced.value).toBe("a")

    vi.advanceTimersByTime(299)
    expect(debounced.value).toBe("a")

    vi.advanceTimersByTime(1)
    expect(debounced.value).toBe("ab")

    scope.stop()
    vi.useRealTimers()
  })

  it("keeps only the last value when typing quickly", async () => {
    vi.useFakeTimers()
    const scope = effectScope()
    const source = ref("")
    let debounced!: ReturnType<typeof useDebouncedValue<string>>

    scope.run(() => {
      debounced = useDebouncedValue(source, 100)
    })

    source.value = "a"
    await nextTick()
    vi.advanceTimersByTime(50)
    source.value = "ab"
    await nextTick()
    vi.advanceTimersByTime(50)
    source.value = "abc"
    await nextTick()
    vi.advanceTimersByTime(100)

    expect(debounced.value).toBe("abc")

    scope.stop()
    vi.useRealTimers()
  })
})
