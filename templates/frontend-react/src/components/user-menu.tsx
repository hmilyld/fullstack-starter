import * as React from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import {
  ChevronsUpDownIcon,
  KeyIcon,
  LogOutIcon,
  ShieldCheckIcon,
  UserCogIcon,
} from "lucide-react"

import { logout as apiLogout } from "@/api/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/lib/auth-context"
import { useSiteConfig } from "@/lib/site-config"

/** 顶栏右上角的账户菜单：个人设置、密码修改、权限总览、退出登录 */
export function UserMenu() {
  const { t } = useTranslation()
  const { user, logout, hasPermission } = useAuth()
  const { refresh } = useSiteConfig()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = React.useState(false)

  if (!user) return null

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="gap-2 rounded-full pr-2 pl-1"
          aria-label={t("userMenu.aria", { name: user.name })}
        >
          <Avatar className="size-7">
            <AvatarImage
              src={user.avatar}
              alt={user.name}
              width={28}
              height={28}
            />
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-24 truncate text-sm font-medium md:inline">
            {user.name}
          </span>
          <ChevronsUpDownIcon className="hidden size-4 text-muted-foreground md:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="size-8">
              <AvatarImage
                src={user.avatar}
                alt={user.name}
                width={32}
                height={32}
              />
              <AvatarFallback>{user.name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => navigate("/settings/profile?tab=profile")}
          >
            <UserCogIcon />
            {t("userMenu.profile")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => navigate("/settings/profile?tab=security")}
          >
            <KeyIcon />
            {t("userMenu.password")}
          </DropdownMenuItem>
          {hasPermission("permissions") && (
            <DropdownMenuItem onSelect={() => navigate("/settings/permission")}>
              <ShieldCheckIcon />
              {t("userMenu.permissions")}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={loggingOut}
          onSelect={() => void handleLogout()}
        >
          {loggingOut ? (
            <>
              <Spinner />
              {t("userMenu.loggingOut")}
            </>
          ) : (
            <>
              <LogOutIcon />
              {t("userMenu.logout")}
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
