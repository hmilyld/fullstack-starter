import * as React from "react"
import { Link } from "react-router"

import { BrandMark } from "@/components/brand-mark"
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
          <BrandMark />
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
