import { computed, watch } from "vue"
import { useSiteConfigStore } from "@/stores/site-config"
import { useThemeStore } from "@/stores/theme"
import { currentLocale, type Locale } from "@/lib/i18n"
import { applyPwaManifest, buildPwaManifest } from "@/lib/pwa"

/** 站点配置、主题或语言变化时，同步更新 PWA manifest 与主题色 */
export function usePwaManifest() {
  const siteConfig = useSiteConfigStore()
  const themeStore = useThemeStore()

  const resolvedTheme = computed(() => themeStore.resolvedTheme)
  const locale = computed<Locale>(() => currentLocale())

  watch(
    [() => siteConfig.config, resolvedTheme, locale],
    ([config, theme, lang]) => {
      applyPwaManifest(buildPwaManifest(config, theme, lang))
    },
    { immediate: true }
  )
}
