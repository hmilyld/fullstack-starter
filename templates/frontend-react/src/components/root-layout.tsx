import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Outlet, useMatches } from "react-router"

import { setPageTitle } from "@/lib/page-title"

type RouteHandle = { titleKey?: string }

/**
 * 根布局：只负责按路由 `handle.titleKey` 维护 `document.title`。
 * 放在根路由上，登录页、注册页与 404 也能拿到各自的标题。
 */
export function RootLayout() {
  const { t } = useTranslation()
  const matches = useMatches()

  const titleKey = matches
    .map((match) => (match.handle as RouteHandle | undefined)?.titleKey)
    .filter((key): key is string => Boolean(key))
    .at(-1)

  useEffect(() => {
    setPageTitle(titleKey ? t(titleKey) : null)
  }, [titleKey, t])

  return <Outlet />
}
