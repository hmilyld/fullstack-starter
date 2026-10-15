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
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const iconOptions = [
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

const iconMap = {
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
}

export function IconPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {iconOptions.map((item) => {
          const Icon = iconMap[item.value as keyof typeof iconMap] || CircleIcon
          return (
            <SelectItem key={item.value} value={item.value}>
              <span className="flex items-center gap-2">
                <Icon className="size-4" />
                {item.label}
              </span>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

export function MenuIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name as keyof typeof iconMap] || CircleIcon
  return <Icon className={className} />
}
