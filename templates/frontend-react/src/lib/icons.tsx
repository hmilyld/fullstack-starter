import {
  BotIcon,
  CircleIcon,
  DatabaseIcon,
  FileTextIcon,
  KeyIcon,
  LayoutDashboardIcon,
  PanelLeftIcon,
  Settings2Icon,
  ShieldCheckIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

/** 菜单图标注册表：侧边栏、图标选择器共用同一份来源 */
export const menuIcons = {
  circle: CircleIcon,
  "layout-dashboard": LayoutDashboardIcon,
  users: UsersIcon,
  "shield-check": ShieldCheckIcon,
  "key-round": KeyIcon,
  "panel-left": PanelLeftIcon,
  settings: Settings2Icon,
  bot: BotIcon,
  "file-text": FileTextIcon,
  database: DatabaseIcon,
} satisfies Record<string, LucideIcon>

export type MenuIconName = keyof typeof menuIcons

export const iconOptions: { value: MenuIconName; label: string }[] = [
  { value: "circle", label: "默认" },
  { value: "layout-dashboard", label: "仪表盘" },
  { value: "users", label: "用户" },
  { value: "shield-check", label: "角色" },
  { value: "key-round", label: "权限" },
  { value: "panel-left", label: "菜单" },
  { value: "settings", label: "设置" },
  { value: "bot", label: "AI" },
  { value: "file-text", label: "文档" },
  { value: "database", label: "数据" },
]

export function MenuIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const Icon = menuIcons[name as MenuIconName] ?? CircleIcon
  return <Icon className={className} />
}
