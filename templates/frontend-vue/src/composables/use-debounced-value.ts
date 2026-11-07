import { onScopeDispose, ref, toValue, watch, type MaybeRefOrGetter } from "vue"

/** 输入停止 delay 毫秒后才返回新值，用于搜索框等高频输入 */
export function useDebouncedValue<T>(source: MaybeRefOrGetter<T>, delay = 300) {
  const debounced = ref(toValue(source)) as ReturnType<typeof ref<T>>
  let timer: ReturnType<typeof setTimeout> | undefined

  watch(
    () => toValue(source),
    (value) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        debounced.value = value
      }, delay)
    }
  )

  onScopeDispose(() => {
    if (timer) clearTimeout(timer)
  })

  return debounced
}
