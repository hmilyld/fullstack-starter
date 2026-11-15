import { get } from "svelte/store"
import { applyPwaManifest, buildPwaManifest } from "#lib/pwa.js"
import { locale } from "#lib/i18n.js"
import { siteConfig } from "#lib/stores/site-config.svelte.js"
import { getResolvedTheme } from "#lib/stores/theme.svelte.js"

/** 站点配置、主题或语言变化时，同步更新 PWA manifest 与主题色 */
export function usePwaManifest() {
  $effect(() => {
    const config = siteConfig.config
    const theme = getResolvedTheme()
    const render = (lang: string) =>
      applyPwaManifest(buildPwaManifest(config, theme, lang))
    render(get(locale))
    return locale.subscribe(render)
  })
}
