<script lang="ts">
  import "./layout.css"
  import "#lib/i18n.js"
  import { t } from "#lib/i18n.js"
  import { siteConfig } from "#lib/stores/site-config.svelte.js"
  import { applyTheme, getResolvedTheme } from "#lib/stores/theme.svelte.js"
  import { useMediaQuery } from "#lib/hooks/use-media-query.svelte.js"
  import { usePwaManifest } from "#lib/hooks/use-pwa-manifest.svelte.js"
  import { Toaster } from "svelte-sonner"
  import Skeleton from "#lib/components/ui/skeleton/skeleton.svelte"

  let { children } = $props()

  usePwaManifest()
  const isDesktop = useMediaQuery("(min-width: 768px)")

  $effect(() => {
    applyTheme(getResolvedTheme())
  })

  // 标题由各页面通过 <svelte:head> 维护（页面名 · 站点名），
  // 布局只负责站点描述，避免语言或配置刷新时把页面标题覆盖成站点名。
  $effect(() => {
    const config = siteConfig.config
    let metaDesc = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]'
    )
    if (!metaDesc) {
      metaDesc = document.createElement("meta")
      metaDesc.name = "description"
      document.head.appendChild(metaDesc)
    }
    metaDesc.content =
      config?.siteDescription?.trim() || $t("pwa.defaultDescription")
  })

  void siteConfig.fetchConfig()
</script>

{#if siteConfig.loading}
  <div class="flex min-h-svh items-center justify-center">
    <div class="flex flex-col items-center gap-4">
      <Skeleton class="h-8 w-48" />
      <Skeleton class="h-4 w-32" />
    </div>
  </div>
{:else}
  {@render children()}
{/if}

<Toaster
  theme={getResolvedTheme()}
  position={isDesktop.matches ? "bottom-right" : "top-center"}
  mobileOffset={{ top: "4.5rem" }}
  richColors
  closeButton
/>
