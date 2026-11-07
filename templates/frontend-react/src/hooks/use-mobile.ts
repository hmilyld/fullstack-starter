import * as React from "react"

const MOBILE_BREAKPOINT = 768

/** 与 Tailwind 的 md 断点保持一致 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(
    () => window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches
  )

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
    )
    const handleChange = () => setIsMobile(mediaQuery.matches)

    handleChange()
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return isMobile
}
