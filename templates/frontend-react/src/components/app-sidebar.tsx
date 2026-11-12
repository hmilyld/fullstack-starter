import * as React from "react"
import { Link } from "react-router"
import { SearchIcon } from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { openCommandMenu } from "@/components/command-menu"
import { useNavigation } from "@/hooks/use-navigation"
import { useSiteConfig } from "@/lib/site-config"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { config } = useSiteConfig()
  const { isMobile, setOpenMobile } = useSidebar()
  const { groups: navGroups } = useNavigation()

  const siteName = config?.siteName || "管理系统"
  const siteDescription = config?.siteDescription || "运营管理后台"

  const groups = navGroups.map((group) => ({
    id: group.id,
    label: group.name,
    items: group.items.map((item) => ({
      title: item.name,
      url: item.route,
      icon: item.icon,
    })),
  }))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="gap-2 p-2">
        <Link
          to="/dashboard"
          onClick={() => {
            if (isMobile) setOpenMobile(false)
          }}
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors outline-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 hover:bg-sidebar-accent focus-visible:ring-[3px] focus-visible:ring-sidebar-ring max-md:pr-10"
        >
          <BrandMark className="size-9 shrink-0" />
          <div className="grid min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-heading text-sm font-semibold">
              {siteName}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {siteDescription}
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={groups} />
      </SidebarContent>
      <SidebarFooter className="gap-1 p-2 group-data-[collapsible=icon]:hidden">
        <button
          type="button"
          onClick={openCommandMenu}
          className="flex h-8 w-full items-center gap-2 rounded-md border bg-background px-2 text-xs text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-[3px] focus-visible:ring-sidebar-ring"
        >
          <SearchIcon className="size-3.5 shrink-0" />
          <span>快速查找</span>
          <kbd className="ml-auto rounded-sm border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </button>
        <p className="px-1 text-[11px] text-muted-foreground">v1.0.0</p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
