import type { LucideIcon } from "lucide-react"

import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export type SettingsNavItem = {
  value: string
  title: string
  icon: LucideIcon
}

/**
 * 设置页左栏导航：无底色轨道，ghost 按钮 + 图标，选中用 bg-muted。
 * 桌面竖排（1/5 宽、sticky），窄屏横排；不自己管理状态，跟随 Tabs。
 */
export function SettingsNav({
  items,
  className,
}: {
  items: SettingsNavItem[]
  className?: string
}) {
  return (
    <TabsList
      className={cn(
        "w-full justify-start gap-1 overflow-x-auto bg-transparent p-0",
        "lg:sticky lg:top-20 lg:w-1/5 lg:min-w-44 lg:flex-col lg:overflow-visible",
        className
      )}
    >
      {items.map((item) => (
        <TabsTrigger
          key={item.value}
          value={item.value}
          className="flex-none justify-start gap-2 px-3 text-sm font-normal text-muted-foreground hover:bg-accent hover:text-foreground data-active:bg-muted data-active:font-medium data-active:text-foreground dark:data-active:bg-muted"
        >
          <item.icon className="size-4 shrink-0" />
          {item.title}
        </TabsTrigger>
      ))}
    </TabsList>
  )
}
