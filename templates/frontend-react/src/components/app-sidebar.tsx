import * as React from "react"
import { Link } from "react-router"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { getNavigation } from "@/api/menu"
import { useAuth } from "@/lib/auth-context"
import { useSiteConfig } from "@/lib/site-config"
import type { NavigationGroup } from "@/types/menu"

const NAVIGATION_REFRESH_EVENT = "navigation-refresh"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const { config } = useSiteConfig()
  const [navGroups, setNavGroups] = React.useState<NavigationGroup[]>([])

  const siteName = config?.siteName || "管理系统"

  React.useEffect(() => {
    let cancelled = false
    async function loadNavigation() {
      try {
        const response = await getNavigation()
        if (!cancelled && response.code === 0) setNavGroups(response.data)
      } catch {
        // 导航不是关键路径，加载失败时保留上一次的菜单
      }
    }
    void loadNavigation()
    window.addEventListener(NAVIGATION_REFRESH_EVENT, loadNavigation)
    return () => {
      cancelled = true
      window.removeEventListener(NAVIGATION_REFRESH_EVENT, loadNavigation)
    }
  }, [])

  const groups = navGroups.map((group) => ({
    label: group.name,
    items: group.items.map((item) => ({
      title: item.name,
      url: item.route,
      icon: item.icon,
    })),
  }))

  const navUser = user
    ? {
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
      }
    : {
        name: "",
        email: "",
        avatar: "",
      }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link
          to="/dashboard"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 outline-none group-data-[collapsible=icon]:justify-center focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          <svg
            className="size-8 shrink-0"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect width="32" height="32" rx="8" className="fill-primary" />
            <path
              d="M8 12h6v2H8v-2zm0 4h10v2H8v-2zm0 4h8v2H8v-2z"
              className="fill-primary-foreground"
            />
            <rect
              x="18"
              y="10"
              width="8"
              height="8"
              rx="2"
              className="fill-primary-foreground"
              fillOpacity="0.8"
            />
            <path
              d="M20 13h4M20 15.5h4"
              stroke="currentColor"
              strokeWidth="1.2"
              className="stroke-primary"
              strokeLinecap="round"
            />
          </svg>
          <span className="truncate text-base font-semibold group-data-[collapsible=icon]:hidden">
            {siteName}
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={groups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
