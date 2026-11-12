import * as React from "react"
import { Link, useLocation } from "react-router"
import { ChevronRightIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { MenuIcon } from "@/lib/icons"
import { cn } from "@/lib/utils"

type NavItem = {
  title: string
  url: string
  icon: string
}

type NavGroup = {
  id: string
  label: string
  items: NavItem[]
}

const CLOSED_GROUPS_KEY = "sidebar-closed-groups"

function isActivePath(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`)
}

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

export function NavMain({ groups }: { groups: NavGroup[] }) {
  const { pathname } = useLocation()
  const { state, isMobile, setOpenMobile } = useSidebar()
  const iconMode = state === "collapsed" && !isMobile
  const [closedGroups, setClosedGroups] =
    React.useState<string[]>(readClosedGroups)

  const activeGroupId = groups.find((group) =>
    group.items.some((item) => isActivePath(pathname, item.url))
  )?.id

  function toggleGroup(id: string) {
    setClosedGroups((previous) => {
      const next = previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id]
      try {
        window.localStorage.setItem(CLOSED_GROUPS_KEY, JSON.stringify(next))
      } catch {
        // 隐私模式下 localStorage 可能不可写，忽略即可
      }
      return next
    })
  }

  function renderItems(items: NavItem[]) {
    return (
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton
              asChild
              isActive={isActivePath(pathname, item.url)}
              tooltip={item.title}
            >
              <Link
                to={item.url}
                aria-current={
                  isActivePath(pathname, item.url) ? "page" : undefined
                }
                onClick={() => {
                  if (isMobile) setOpenMobile(false)
                }}
              >
                <MenuIcon name={item.icon} />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    )
  }

  return (
    <>
      {groups.map((group) => {
        if (iconMode) {
          return (
            <SidebarGroup key={group.id}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              {renderItems(group.items)}
            </SidebarGroup>
          )
        }

        // 当前路由所在分组始终展开，避免进入页面后看不到所属菜单
        const open =
          group.id === activeGroupId || !closedGroups.includes(group.id)

        return (
          <Collapsible
            key={group.id}
            open={open}
            onOpenChange={() => toggleGroup(group.id)}
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="group/label w-full justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                  <span className="truncate">{group.label}</span>
                  <ChevronRightIcon
                    className={cn(
                      "size-3.5 shrink-0 opacity-60 transition-transform duration-200",
                      open && "rotate-90"
                    )}
                  />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                {renderItems(group.items)}
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )
      })}
    </>
  )
}
