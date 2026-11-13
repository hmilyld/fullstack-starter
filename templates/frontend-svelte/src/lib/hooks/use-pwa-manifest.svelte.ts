import { applyPwaManifest, buildPwaManifest } from "#lib/pwa.js"
import { siteConfig } from "#lib/stores/site-config.svelte.js"
import { getResolvedTheme } from "#lib/stores/theme.svelte.js"

/** 站点配置或主题变化时，同步更新 PWA manifest 与主题色 */
export function usePwaManifest() {
  $effect(() => {
    applyPwaManifest(buildPwaManifest(siteConfig.config, getResolvedTheme()))
  })
}
