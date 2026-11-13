<script lang="ts">
  import { Search } from "@lucide/svelte"
  import ConfigDrawer from "#lib/components/app-shell/config-drawer.svelte"
  import ThemeToggle from "#lib/components/app-shell/theme-toggle.svelte"
  import UserMenu from "#lib/components/app-shell/user-menu.svelte"
  import { openCommandMenu } from "#lib/hooks/use-command-menu.svelte.js"
  import { Button } from "#lib/components/ui/button/index.js"
  import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
  } from "#lib/components/ui/breadcrumb/index.js"
  import { Separator } from "#lib/components/ui/separator/index.js"
  import { SidebarTrigger } from "#lib/components/ui/sidebar/index.js"
  import { buildBreadcrumbs } from "#lib/routes.js"
  import { cn } from "#lib/utils.js"
  import { page } from "$app/state"

  const crumbs = $derived(buildBreadcrumbs(page.url.pathname))
  const currentCrumb = $derived(crumbs[crumbs.length - 1])
  let scrolled = $state(false)

  function onScroll() {
    scrolled = window.scrollY > 10
  }
</script>

<svelte:window onscroll={onScroll} />

<header
  class={cn(
    "sticky top-0 z-30 shrink-0 border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/80",
    scrolled && "shadow-sm"
  )}
>
  <div
    class="mx-auto flex h-14 w-full max-w-(--layout-max) items-center gap-2 px-(--layout-gutter) md:h-16"
  >
    <div class="flex min-w-0 items-center gap-2">
      <SidebarTrigger class="-ml-1" aria-label="切换侧边栏" />
      <Separator
        orientation="vertical"
        class="mr-1 hidden h-5 self-center md:block"
      />
      <Breadcrumb class="hidden md:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">管理后台</BreadcrumbLink>
          </BreadcrumbItem>
          {#each crumbs as crumb, index (crumb.path)}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {#if index === crumbs.length - 1 || !crumb.hasRoute}
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              {:else}
                <BreadcrumbLink href={crumb.path}>
                  {crumb.label}
                </BreadcrumbLink>
              {/if}
            </BreadcrumbItem>
          {/each}
        </BreadcrumbList>
      </Breadcrumb>
      <span class="truncate text-sm font-medium md:hidden">
        {currentCrumb?.label ?? "管理后台"}
      </span>
    </div>

    <div class="ml-auto flex items-center gap-1">
      <Button
        variant="outline"
        class="hidden w-44 justify-start gap-2 text-sm font-normal text-muted-foreground shadow-none lg:inline-flex xl:w-60"
        aria-keyshortcuts="Meta+K Control+K"
        onclick={openCommandMenu}
      >
        <Search class="size-4 shrink-0" />
        <span class="truncate">搜索…</span>
        <kbd
          class="ml-auto rounded-sm border bg-muted px-1.5 py-0.5 font-mono text-[10px]"
        >
          ⌘K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        class="lg:hidden"
        aria-label="搜索页面或菜单"
        onclick={openCommandMenu}
      >
        <Search />
      </Button>
      <ThemeToggle />
      <ConfigDrawer />
      <Separator
        orientation="vertical"
        class="mx-1 hidden h-5 self-center sm:block"
      />
      <UserMenu />
    </div>
  </div>
</header>
