import { useMediaQuery } from "@/composables/use-media-query"

const MOBILE_BREAKPOINT = 768

/** 与 Tailwind 的 md 断点保持一致 */
export function useIsMobile() {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
}
