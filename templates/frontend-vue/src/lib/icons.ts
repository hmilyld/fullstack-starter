import {
  Bot,
  Circle,
  Database,
  FileText,
  KeyRound,
  LayoutDashboard,
  PanelLeft,
  Settings2,
  ShieldCheck,
  Users,
} from "@lucide/vue"

/** 菜单图标注册表：侧边栏、图标选择器共用同一份来源 */
export const menuIcons = {
  circle: Circle,
  "layout-dashboard": LayoutDashboard,
  users: Users,
  "shield-check": ShieldCheck,
  "key-round": KeyRound,
  "panel-left": PanelLeft,
  settings: Settings2,
  bot: Bot,
  "file-text": FileText,
  database: Database,
}

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
