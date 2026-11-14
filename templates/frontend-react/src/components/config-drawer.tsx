import { MonitorIcon, MoonIcon, Settings2Icon, SunIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

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
  { value: "light", labelKey: "appearance.light", icon: SunIcon },
  { value: "dark", labelKey: "appearance.dark", icon: MoonIcon },
  { value: "system", labelKey: "appearance.system", icon: MonitorIcon },
] as const

const VARIANTS: { value: SidebarVariant; labelKey: string }[] = [
  { value: "sidebar", labelKey: "appearance.default" },
  { value: "floating", labelKey: "appearance.floating" },
  { value: "inset", labelKey: "appearance.inset" },
]

const COLLAPSIBLES: { value: SidebarCollapsible; labelKey: string }[] = [
  { value: "icon", labelKey: "appearance.icon" },
  { value: "offcanvas", labelKey: "appearance.offcanvas" },
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
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const { variant, collapsible, setVariant, setCollapsible } = useLayoutConfig()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("common.appearance")}
          title={t("common.appearance")}
        >
          <Settings2Icon />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-80">
        <SheetHeader>
          <SheetTitle>{t("appearance.title")}</SheetTitle>
          <SheetDescription>{t("appearance.description")}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4 pb-6">
          <OptionGroup
            label={t("appearance.theme")}
            value={theme}
            options={THEMES.map((item) => ({
              value: item.value,
              label: t(item.labelKey),
              icon: item.icon,
            }))}
            onChange={setTheme}
          />
          <OptionGroup
            label={t("appearance.sidebar")}
            value={variant}
            options={VARIANTS.map((item) => ({
              ...item,
              label: t(item.labelKey),
            }))}
            onChange={setVariant}
          />
          <OptionGroup
            label={t("appearance.collapse")}
            value={collapsible}
            options={COLLAPSIBLES.map((item) => ({
              ...item,
              label: t(item.labelKey),
            }))}
            onChange={setCollapsible}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
