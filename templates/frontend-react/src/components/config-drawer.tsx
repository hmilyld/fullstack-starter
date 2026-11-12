import { MonitorIcon, MoonIcon, Settings2Icon, SunIcon } from "lucide-react"

import type {
  SidebarCollapsible,
  SidebarVariant,
} from "@/components/layout-config"
import { useLayoutConfig } from "@/components/layout-config"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const THEMES = [
  { value: "light", label: "浅色", icon: SunIcon },
  { value: "dark", label: "深色", icon: MoonIcon },
  { value: "system", label: "跟随系统", icon: MonitorIcon },
] as const

const VARIANTS: { value: SidebarVariant; label: string }[] = [
  { value: "sidebar", label: "默认" },
  { value: "floating", label: "浮动" },
  { value: "inset", label: "内嵌" },
]

const COLLAPSIBLES: { value: SidebarCollapsible; label: string }[] = [
  { value: "icon", label: "图标栏" },
  { value: "offcanvas", label: "抽屉" },
]

function OptionGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string; icon?: React.ElementType }[]
  onChange: (value: T) => void
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{label}</h3>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label={label}>
        {options.map((option) => {
          const Icon = option.icon
          return (
            <Button
              key={option.value}
              type="button"
              variant={value === option.value ? "default" : "outline"}
              aria-pressed={value === option.value}
              onClick={() => onChange(option.value)}
              className={cn("h-auto flex-col gap-1.5 px-2 py-3 text-xs")}
            >
              {Icon && <Icon className="size-4" />}
              {option.label}
            </Button>
          )
        })}
      </div>
    </section>
  )
}

/** 外观抽屉：主题、侧栏样式、折叠方式 */
export function ConfigDrawer() {
  const { theme, setTheme } = useTheme()
  const { variant, collapsible, setVariant, setCollapsible } = useLayoutConfig()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="外观设置"
          title="外观设置"
        >
          <Settings2Icon />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-80">
        <SheetHeader>
          <SheetTitle>外观</SheetTitle>
          <SheetDescription>
            调整主题、侧栏样式与折叠方式，设置会保存在本机。
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4 pb-6">
          <OptionGroup
            label="主题"
            value={theme}
            options={THEMES.map((item) => ({ ...item }))}
            onChange={setTheme}
          />
          <OptionGroup
            label="侧栏样式"
            value={variant}
            options={VARIANTS}
            onChange={setVariant}
          />
          <OptionGroup
            label="折叠方式"
            value={collapsible}
            options={COLLAPSIBLES}
            onChange={setCollapsible}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
