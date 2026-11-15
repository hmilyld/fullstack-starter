import * as React from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router"
import { SearchIcon } from "lucide-react"

import { openCommandMenu } from "@/components/command-menu"
import { ConfigDrawer } from "@/components/config-drawer"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/user-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { buildBreadcrumbs } from "@/lib/routes"
import { cn } from "@/lib/utils"

export function Header() {
  const { t } = useTranslation()
  const location = useLocation()
  const crumbs = buildBreadcrumbs(location.pathname)
  const currentCrumb = crumbs[crumbs.length - 1]
  const [scrolled, setScrolled] = React.useState(false)

  function crumbLabel(crumb: { path: string; label: string }) {
    const segment = crumb.path.split("/").filter(Boolean).pop() ?? ""
    return t(`routes.${segment}`, { defaultValue: crumb.label })
  }

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-30 shrink-0 border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/80",
        scrolled && "shadow-sm"
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-(--layout-max) items-center gap-2 px-(--layout-gutter) md:h-16">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-1 hidden h-5 self-center md:block"
          />
          <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard">{t("common.admin")}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1
                return (
                  <React.Fragment key={crumb.path}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {isLast || !crumb.hasRoute ? (
                        <BreadcrumbPage>{crumbLabel(crumb)}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={crumb.path}>{crumbLabel(crumb)}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
          <span className="truncate text-sm font-medium md:hidden">
            {currentCrumb ? crumbLabel(currentCrumb) : t("common.admin")}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="outline"
            onClick={openCommandMenu}
            className="hidden w-44 justify-start gap-2 text-sm font-normal text-muted-foreground shadow-none lg:inline-flex xl:w-60"
            aria-keyshortcuts="Meta+K Control+K"
          >
            <SearchIcon className="size-4 shrink-0" />
            <span className="truncate">{t("common.search")}</span>
            <kbd className="ml-auto rounded-sm border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              ⌘K
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={openCommandMenu}
            className="lg:hidden"
            aria-label={t("common.searchAria")}
          >
            <SearchIcon />
          </Button>
          <LanguageSwitcher />
          <ThemeToggle />
          <ConfigDrawer />
          <Separator
            orientation="vertical"
            className="mx-1 hidden h-5 self-center sm:block"
          />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
