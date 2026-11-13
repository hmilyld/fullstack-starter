<script lang="ts">
  import { ChevronRight } from "@lucide/svelte"
  import MenuIcon from "#lib/components/shared/menu-icon.svelte"
  import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
  } from "#lib/components/ui/collapsible/index.js"
  import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
  } from "#lib/components/ui/sidebar/index.js"
  import { page } from "$app/state"

  type NavItem = { title: string; url: string; icon: string }
  type NavGroup = { label: string; items: NavItem[] }

  let { groups }: { groups: NavGroup[] } = $props()

  const CLOSED_GROUPS_KEY = "sidebar-closed-groups"
  const sidebar = useSidebar()

  function readClosedGroups(): string[] {
    try {
      const raw = window.localStorage.getItem(CLOSED_GROUPS_KEY)
      const parsed: unknown = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed)
        ? parsed.filter((value): value is string => typeof value === "string")
        : []
    } catch {
      return []
    }
  }

  let closedGroups = $state<string[]>(readClosedGroups())
  const iconMode = $derived(sidebar.state === "collapsed" && !sidebar.isMobile)

  const activeGroup = $derived(
    groups.find((group) =>
      group.items.some((item) => isActivePath(page.url.pathname, item.url))
    )?.label
  )

  function isActivePath(pathname: string, url: string) {
    return pathname === url || pathname.startsWith(`${url}/`)
  }

  function isOpen(group: NavGroup) {
    return group.label === activeGroup || !closedGroups.includes(group.label)
  }

  function toggleGroup(group: NavGroup, value: boolean) {
    const next = value
      ? closedGroups.filter((label) => label !== group.label)
      : [...closedGroups, group.label]
    closedGroups = next
    try {
      window.localStorage.setItem(CLOSED_GROUPS_KEY, JSON.stringify(next))
    } catch {
      // 隐私模式下 localStorage 不可写，忽略
    }
  }

  function handleNavigate() {
    if (sidebar.isMobile) sidebar.setOpenMobile(false)
  }
</script>

{#each groups as group (group.label)}
  <Collapsible
    open={iconMode || isOpen(group)}
    disabled={iconMode}
    onOpenChange={(value) => toggleGroup(group, value)}
  >
    <SidebarGroup>
      <SidebarGroupLabel class="p-0">
        <CollapsibleTrigger
          class="group/label flex h-8 w-full items-center justify-between rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <span class="truncate">{group.label}</span>
          <ChevronRight
            class={[
              "size-3.5 shrink-0 opacity-0 transition-[opacity,transform] duration-200 group-hover/label:opacity-60 focus-visible:opacity-100",
              (iconMode || isOpen(group)) && "rotate-90",
            ]}
          />
        </CollapsibleTrigger>
      </SidebarGroupLabel>
      <CollapsibleContent data-slot="collapsible-content">
        <SidebarMenu>
          {#each group.items as item (item.url)}
            {@const active = isActivePath(page.url.pathname, item.url)}
            <SidebarMenuItem>
              <SidebarMenuButton isActive={active} tooltipContent={item.title}>
                {#snippet child({ props })}
                  <a
                    {...props}
                    href={item.url}
                    aria-current={active ? "page" : undefined}
                    onclick={handleNavigate}
                  >
                    <MenuIcon name={item.icon} />
                    <span>{item.title}</span>
                  </a>
                {/snippet}
              </SidebarMenuButton>
            </SidebarMenuItem>
          {/each}
        </SidebarMenu>
      </CollapsibleContent>
    </SidebarGroup>
  </Collapsible>
{/each}
