import { computed, watch } from "vue"
import { useSiteConfigStore } from "@/stores/site-config"
import { useThemeStore } from "@/stores/theme"
import { applyPwaManifest, buildPwaManifest } from "@/lib/pwa"

/** 站点配置或主题变化时，同步更新 PWA manifest 与主题色 */
export function usePwaManifest() {
  const siteConfig = useSiteConfigStore()
  const themeStore = useThemeStore()

  const resolvedTheme = computed(() => themeStore.resolvedTheme)

  watch(
    [() => siteConfig.config, resolvedTheme],
    ([config, theme]) => {
      applyPwaManifest(buildPwaManifest(config, theme))
    },
    { immediate: true }
  )
}
