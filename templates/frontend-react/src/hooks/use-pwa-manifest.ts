import * as React from "react"

import { useTheme } from "@/components/theme-provider"
import { useSiteConfig } from "@/lib/site-config"
import { applyPwaManifest, buildPwaManifest, type PwaTheme } from "@/lib/pwa"

function getSystemTheme(): PwaTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

/** 站点配置或主题变化时，同步更新 PWA manifest 与主题色 */
export function usePwaManifest() {
  const { config } = useSiteConfig()
  const { theme } = useTheme()
  const [systemTheme, setSystemTheme] = React.useState<PwaTheme>(getSystemTheme)

  React.useEffect(() => {
    if (theme !== "system") return
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => setSystemTheme(getSystemTheme())

    handleChange()
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  const resolvedTheme: PwaTheme = theme === "system" ? systemTheme : theme

  React.useEffect(() => {
    applyPwaManifest(buildPwaManifest(config, resolvedTheme))
  }, [config, resolvedTheme])
}
