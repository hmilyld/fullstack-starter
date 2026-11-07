type RouteMeta = {
  label: string
  /** false 表示该路径只是分组，没有对应页面 */
  hasRoute?: boolean
}

/** 路由段与中文名称的映射，供面包屑等展示使用 */
export const routeMeta: Record<string, RouteMeta> = {
  dashboard: { label: "仪表盘" },
  settings: { label: "设置", hasRoute: false },
  user: { label: "用户管理" },
  role: { label: "角色管理" },
  permission: { label: "权限管理" },
  menu: { label: "菜单管理" },
  profile: { label: "个人设置" },
  system: { label: "系统设置" },
  "ai-model": { label: "AI 模型配置" },
  "audit-log": { label: "审计日志" },
  data: { label: "数据管理" },
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
      label: meta.label,
      hasRoute: meta.hasRoute !== false,
    })
  }

  return crumbs
}
