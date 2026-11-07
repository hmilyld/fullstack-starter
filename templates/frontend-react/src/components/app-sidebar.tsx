import * as React from "react"
import { Link } from "react-router"

import { BrandMark } from "@/components/brand-mark"
import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { getNavigation } from "@/api/menu"
import { useSiteConfig } from "@/lib/site-config"
import type { NavigationGroup } from "@/types/menu"

const NAVIGATION_REFRESH_EVENT = "navigation-refresh"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { config } = useSiteConfig()
  const { isMobile, setOpenMobile } = useSidebar()
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

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link
          to="/dashboard"
          onClick={() => {
            if (isMobile) setOpenMobile(false)
          }}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 outline-none group-data-[collapsible=icon]:justify-center focus-visible:ring-3 focus-visible:ring-ring/30 max-md:pr-10"
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
      <SidebarRail />
    </Sidebar>
  )
}
