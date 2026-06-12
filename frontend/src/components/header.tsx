import * as React from "react"
import { Link, useLocation } from "react-router"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { BellIcon } from "lucide-react"

/** 所有有效路由及其面包屑标签，hasRoute=false 表示该路径无对应路由页面 */
const routeMap: Record<string, { label: string; hasRoute?: boolean }> = {
  dashboard: { label: "仪表盘" },
  settings: { label: "设置", hasRoute: false },
  user: { label: "用户管理" },
  role: { label: "角色管理" },
  permission: { label: "权限管理" },
  profile: { label: "个人设置" },
  system: { label: "系统设置" },
}

/** 从路径生成面包屑层级 */
function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  const crumbs: { segment: string; label: string; path: string; hasRoute: boolean }[] = []

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    const route = routeMap[seg]
    if (!route) continue

    const path = `/${segments.slice(0, i + 1).join("/")}`
    crumbs.push({
      segment: seg,
      label: route.label,
      path,
      hasRoute: route.hasRoute !== false,
    })
  }

  return crumbs
}

export function Header() {
  const location = useLocation()
  const crumbs = buildBreadcrumbs(location.pathname)

  return (
    <header className="flex min-h-14 shrink-0 items-center gap-2 border-b px-4 py-2 transition-[width,height] ease-linear">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb key={location.pathname}>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink asChild>
                <Link to="/dashboard">管理后台</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1
              return (
                <React.Fragment key={crumb.path}>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    {isLast || !crumb.hasRoute ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.path}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <BellIcon data-icon="inline-start" />
          <span className="sr-only">通知</span>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  )
}
