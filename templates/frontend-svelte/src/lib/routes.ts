import { translate } from "#lib/i18n.js"

type RouteMeta = {
  labelKey: string
  /** false 表示该路径只是分组，没有对应页面 */
  hasRoute?: boolean
}

/** 路由段与翻译键的映射，供面包屑等展示使用 */
export const routeMeta: Record<string, RouteMeta> = {
  dashboard: { labelKey: "routes.dashboard" },
  settings: { labelKey: "routes.settings", hasRoute: false },
  user: { labelKey: "routes.user" },
  role: { labelKey: "routes.role" },
  permission: { labelKey: "routes.permission" },
  menu: { labelKey: "routes.menu" },
  profile: { labelKey: "routes.profile" },
  system: { labelKey: "routes.system" },
  "ai-model": { labelKey: "routes.ai-model" },
  "audit-log": { labelKey: "routes.audit-log" },
  data: { labelKey: "routes.data" },
}

export type Breadcrumb = {
  path: string
  label: string
  hasRoute: boolean
}

export function buildBreadcrumbs(pathname: string): Breadcrumb[] {
  const segments = pathname.split("/").filter(Boolean)
  const crumbs: Breadcrumb[] = []

  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index]
    const meta = routeMeta[segment]
    if (!meta) continue

    crumbs.push({
      path: `/${segments.slice(0, index + 1).join("/")}`,
      label: translate(meta.labelKey),
      hasRoute: meta.hasRoute !== false,
    })
  }

  return crumbs
}
