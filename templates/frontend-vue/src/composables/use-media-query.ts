import { onBeforeUnmount, onMounted, ref } from "vue"

/** 订阅 CSS 媒体查询，用于在小屏时不挂载整个应用 */
export function useMediaQuery(query: string) {
  const matches = ref(false)

  let mediaQuery: MediaQueryList | null = null

  function handleChange(event?: MediaQueryListEvent) {
    matches.value = event?.matches ?? mediaQuery?.matches ?? false
  }

  onMounted(() => {
    mediaQuery = window.matchMedia(query)
    handleChange()
    mediaQuery.addEventListener("change", handleChange)
  })

  onBeforeUnmount(() => {
    mediaQuery?.removeEventListener("change", handleChange)
  })

  return matches
}
