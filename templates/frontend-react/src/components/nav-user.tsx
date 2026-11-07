import * as React from "react"
import { useNavigate } from "react-router"

import { logout as apiLogout } from "@/api/auth"
import { useAuth } from "@/lib/auth-context"
import { useSiteConfig } from "@/lib/site-config"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import {
  ChevronsUpDownIcon,
  KeyIcon,
  LogOutIcon,
  UserCogIcon,
} from "lucide-react"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { logout } = useAuth()
  const { refresh } = useSiteConfig()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = React.useState(false)

  function handleNavigate(tab: string) {
    navigate(`/settings/profile?tab=${tab}`)
  }

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await apiLogout()
    } finally {
      logout()
      await refresh()
      navigate("/login", { replace: true })
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage
                  src={user.avatar}
                  alt={user.name}
                  width={32}
                  height={32}
                />
                <AvatarFallback className="rounded-lg">
                  {user.name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56"
            side="right"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage
                    src={user.avatar}
                    alt={user.name}
                    width={32}
                    height={32}
                  />
                  <AvatarFallback className="rounded-lg">
                    {user.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => handleNavigate("profile")}>
                <UserCogIcon />
                个人设置
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavigate("security")}>
                <KeyIcon />
                密码修改
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={loggingOut} onClick={handleLogout}>
              {loggingOut ? (
                <>
                  <Spinner />
                  退出中…
                </>
              ) : (
                <>
                  <LogOutIcon />
                  退出登录
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
