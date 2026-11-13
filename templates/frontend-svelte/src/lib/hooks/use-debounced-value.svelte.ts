/** 输入停止 delay 毫秒后才返回新值，用于搜索框等高频输入 */
export function useDebouncedValue<T>(source: () => T, delay = 300) {
  let value = $state(source())

  $effect(() => {
    const next = source()
    const timer = setTimeout(() => {
      value = next
    }, delay)
    return () => clearTimeout(timer)
  })

  return {
    get value() {
      return value
    },
  }
}
