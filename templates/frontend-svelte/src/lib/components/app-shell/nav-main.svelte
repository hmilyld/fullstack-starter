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
  import { cn } from "#lib/utils.js"

  type NavItem = { title: string; url: string; icon: string }
  type NavGroup = { id: string; label: string; items: NavItem[] }

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
    )?.id
  )

  function isActivePath(pathname: string, url: string) {
    return pathname === url || pathname.startsWith(`${url}/`)
  }

  function isOpen(group: NavGroup) {
    return group.id === activeGroup || !closedGroups.includes(group.id)
  }

  function toggleGroup(group: NavGroup, value: boolean) {
    const next = value
      ? closedGroups.filter((id) => id !== group.id)
      : [...closedGroups, group.id]
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

{#each groups as group (group.id)}
  <Collapsible
    open={iconMode || isOpen(group)}
    disabled={iconMode}
    onOpenChange={(value) => toggleGroup(group, value)}
  >
    <SidebarGroup>
      <SidebarGroupLabel>
        {#snippet child({ props })}
          <CollapsibleTrigger
            {...props}
            class={cn(
              "group/label w-full justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-[3px] focus-visible:ring-sidebar-ring",
              typeof props.class === "string" ? props.class : ""
            )}
          >
            <span class="truncate">{group.label}</span>
            <ChevronRight
              class={[
                "size-3.5 shrink-0 opacity-0 transition-[opacity,transform] duration-200 group-hover/label:opacity-60 focus-visible:opacity-100",
                (iconMode || isOpen(group)) && "rotate-90",
              ]}
            />
          </CollapsibleTrigger>
        {/snippet}
      </SidebarGroupLabel>
      <CollapsibleContent data-slot="collapsible-content">
        <SidebarMenu>
          {#each group.items as item (item.url)}
            {@const active = isActivePath(page.url.pathname, item.url)}
            <SidebarMenuItem>
              <SidebarMenuButton isActive={active} tooltipContent={item.title}>
                {#snippet child({ props })}
                  <!-- eslint-disable svelte/no-navigation-without-resolve -- 菜单路由来自后端，运行时才能确定 -->
                  <a
                    {...props}
                    href={item.url}
                    aria-current={active ? "page" : undefined}
                    onclick={handleNavigate}
                  >
                    <MenuIcon name={item.icon} />
                    <span>{item.title}</span>
                  </a>
                  <!-- eslint-enable svelte/no-navigation-without-resolve -->
                {/snippet}
              </SidebarMenuButton>
            </SidebarMenuItem>
          {/each}
        </SidebarMenu>
      </CollapsibleContent>
    </SidebarGroup>
  </Collapsible>
{/each}
