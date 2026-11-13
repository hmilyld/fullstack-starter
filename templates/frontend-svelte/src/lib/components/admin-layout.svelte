<script lang="ts">
  import { page } from "$app/state"
  import AppSidebar from "#lib/components/app-shell/app-sidebar.svelte"
  import AppHeader from "#lib/components/app-shell/app-header.svelte"
  import CommandMenu from "#lib/components/app-shell/command-menu.svelte"
  import {
    SidebarInset,
    SidebarProvider,
  } from "#lib/components/ui/sidebar/index.js"
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()

  function initialOpen() {
    if (typeof window === "undefined") return true
    if (!window.matchMedia("(min-width: 1280px)").matches) return false
    const saved = document.cookie.match(/(?:^|;\s*)sidebar_state=(true|false)/)
    return saved ? saved[1] === "true" : true
  }

  let open = $state(initialOpen())

  $effect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1280px)")
    const handleChange = () => {
      if (!mediaQuery.matches) open = false
    }
    handleChange()
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  })

  const pathname = $derived(page.url.pathname)
  // 构建时注入，值来自 package.json
  const appVersion = __APP_VERSION__
</script>

<SidebarProvider bind:open>
  <a
    href="#main-content"
    class="sr-only rounded-lg bg-background px-3 py-2 text-sm font-medium ring-[3px] ring-ring focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
  >
    跳到主内容
  </a>
  <AppSidebar />
  <SidebarInset>
    <AppHeader />
    <main id="main-content" tabindex="-1" class="flex-1 outline-none">
      {#key pathname}
        <div
          class="mx-auto w-full max-w-(--layout-max) content-in px-(--layout-gutter) py-4 md:py-6"
        >
          {@render children?.()}
        </div>
      {/key}
    </main>
    <footer
      class="shrink-0 px-(--layout-gutter) pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground"
    >
      © {new Date().getFullYear()} hmilyld.com · v{appVersion}
    </footer>
  </SidebarInset>
  <CommandMenu />
</SidebarProvider>
