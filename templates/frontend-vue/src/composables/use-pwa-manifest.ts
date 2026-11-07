import { computed, onBeforeUnmount, ref, watch } from "vue"
import { useSiteConfigStore } from "@/stores/site-config"
import { useThemeStore } from "@/stores/theme"
import { applyPwaManifest, buildPwaManifest, type PwaTheme } from "@/lib/pwa"

function getSystemTheme(): PwaTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

/** 站点配置或主题变化时，同步更新 PWA manifest 与主题色 */
export function usePwaManifest() {
  const siteConfig = useSiteConfigStore()
  const themeStore = useThemeStore()
  const systemTheme = ref<PwaTheme>(getSystemTheme())

  const mediaQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null

  function handleSystemThemeChange() {
    systemTheme.value = getSystemTheme()
  }

  watch(
    () => themeStore.theme,
    (theme) => {
      if (!mediaQuery) return
      if (theme === "system") {
        handleSystemThemeChange()
        mediaQuery.addEventListener("change", handleSystemThemeChange)
      } else {
        mediaQuery.removeEventListener("change", handleSystemThemeChange)
      }
    },
    { immediate: true }
  )

  const resolvedTheme = computed<PwaTheme>(() =>
    themeStore.theme === "system" ? systemTheme.value : themeStore.theme
  )

  watch(
    [() => siteConfig.config, resolvedTheme],
    ([config, theme]) => {
      applyPwaManifest(buildPwaManifest(config, theme))
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    mediaQuery?.removeEventListener("change", handleSystemThemeChange)
  })
}
