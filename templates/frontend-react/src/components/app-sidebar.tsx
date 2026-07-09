import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  UsersIcon,
  ShieldCheckIcon,
  KeyIcon,
  Settings2Icon,
  BotIcon,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useSiteConfig } from "@/lib/site-config"

const data = {
  navGroups: [
    {
      label: "导航",
      items: [
        { title: "仪表盘", url: "/dashboard", icon: <LayoutDashboardIcon />, permission: "dashboard" },
      ],
    },
    {
      label: "管理",
      items: [
        { title: "用户管理", url: "/settings/user", icon: <UsersIcon />, permission: "users" },
        { title: "角色管理", url: "/settings/role", icon: <ShieldCheckIcon />, permission: "roles" },
        { title: "权限管理", url: "/settings/permission", icon: <KeyIcon />, permission: "permissions" },
        { title: "系统设置", url: "/settings/system", icon: <Settings2Icon />, permission: "settings" },
        { title: "AI模型配置", url: "/settings/ai-model", icon: <BotIcon />, permission: "ai_models" },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { hasPermission, user } = useAuth()
  const { config } = useSiteConfig()

  const siteName = config?.siteName || "管理系统"

  const filteredData = {
    ...data,
    navGroups: data.navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => !item.permission || hasPermission(item.permission)
        ),
      }))
      .filter((group) => group.items.length > 0),
  }

  const navUser = user ? {
    name: user.name,
    email: user.email,
    avatar: user.avatar || "",
  } : {
    name: "",
    email: "",
    avatar: "",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center">
          <svg
            className="size-8 shrink-0"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
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
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={filteredData.navGroups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
