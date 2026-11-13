<script lang="ts">
  import { onMount } from "svelte"
  import { resolve } from "$app/paths"
  import { Search } from "@lucide/svelte"
  import BrandMark from "#lib/components/brand-mark.svelte"
  import NavMain from "#lib/components/app-shell/nav-main.svelte"
  import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    useSidebar,
  } from "#lib/components/ui/sidebar/index.js"
  import { openCommandMenu } from "#lib/hooks/use-command-menu.svelte.js"
  import { useLayoutConfig } from "#lib/hooks/use-layout-config.svelte.js"
  import {
    onNavigationRefresh,
    useNavigation,
  } from "#lib/hooks/use-navigation.svelte.js"
  import { DEFAULT_SITE_NAME } from "#lib/pwa.js"
  import { siteConfig } from "#lib/stores/site-config.svelte.js"

  const sidebar = useSidebar()
  const navigation = useNavigation()
  const layout = useLayoutConfig()

  const siteName = $derived(siteConfig.config?.siteName || DEFAULT_SITE_NAME)
  const siteDescription = $derived(
    siteConfig.config?.siteDescription || "运营管理后台"
  )

  const groups = $derived(
    navigation.groups.map((group) => ({
      label: group.name,
      items: group.items.map((item) => ({
        title: item.name,
        url: item.route,
        icon: item.icon,
      })),
    }))
  )

  function handleHeaderClick() {
    if (sidebar.isMobile) sidebar.setOpenMobile(false)
  }

  onMount(() => {
    void navigation.load(true)
    return onNavigationRefresh(() => {
      void navigation.load(true)
    })
  })
</script>

<Sidebar variant={layout.variant} collapsible={layout.collapsible}>
  <SidebarHeader class="gap-2 p-2">
    <a
      href={resolve("dashboard")}
      class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors outline-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 hover:bg-sidebar-accent focus-visible:ring-[3px] focus-visible:ring-sidebar-ring max-md:pr-10"
      onclick={handleHeaderClick}
    >
      <BrandMark class="size-9 shrink-0" />
      <div
        class="grid min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden"
      >
        <span class="truncate font-heading text-sm font-semibold">
          {siteName}
        </span>
        <span class="truncate text-xs text-muted-foreground">
          {siteDescription}
        </span>
      </div>
    </a>
  </SidebarHeader>
  <SidebarContent>
    <NavMain {groups} />
  </SidebarContent>
  <SidebarFooter class="gap-1 p-2 group-data-[collapsible=icon]:hidden">
    <button
      type="button"
      class="flex h-8 w-full items-center gap-2 rounded-md border bg-background px-2 text-xs text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-[3px] focus-visible:ring-sidebar-ring"
      onclick={openCommandMenu}
    >
      <Search class="size-3.5 shrink-0" />
      <span>快速查找</span>
      <kbd
        class="ml-auto rounded-sm border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground"
      >
        ⌘K
      </kbd>
    </button>
  </SidebarFooter>
  <SidebarRail />
</Sidebar>
