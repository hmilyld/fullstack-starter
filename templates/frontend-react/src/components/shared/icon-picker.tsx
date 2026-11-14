import { useTranslation } from "react-i18next"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { iconGroupOrder, iconOptions, menuIcons } from "@/lib/icons"

export { MenuIcon } from "@/lib/icons"

export function IconPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full" aria-label={t("iconPicker.aria")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {iconGroupOrder.map((group) => {
          const items = iconOptions.filter((item) => item.group === group)
          if (items.length === 0) return null
          return (
            <SelectGroup key={group}>
              <SelectLabel>
                {t(`iconPicker.groups.${group}`, { defaultValue: group })}
              </SelectLabel>
              {items.map((item) => {
                const Icon = menuIcons[item.value]
                return (
                  <SelectItem key={item.value} value={item.value}>
                    <span className="flex items-center gap-2">
                      <Icon className="size-4" />
                      {t(`icons.${item.value}`, { defaultValue: item.label })}
                    </span>
                  </SelectItem>
                )
              })}
            </SelectGroup>
          )
        })}
      </SelectContent>
    </Select>
  )
}
