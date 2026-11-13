/** 订阅 CSS 媒体查询，用于在小屏切换布局 */
export function useMediaQuery(query: string) {
  let matches = $state(false)

  $effect(() => {
    const mediaQuery = window.matchMedia(query)
    matches = mediaQuery.matches

    const handleChange = (event: MediaQueryListEvent) => {
      matches = event.matches
    }
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  })

  return {
    get matches() {
      return matches
    },
  }
}
