import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { iconOptions, menuIcons, type MenuIconGroup } from "@/lib/icons"

export { MenuIcon } from "@/lib/icons"

const GROUP_ORDER: MenuIconGroup[] = ["常用", "数据", "系统", "内容"]

export function IconPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full" aria-label="选择图标">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {GROUP_ORDER.map((group) => {
          const items = iconOptions.filter((item) => item.group === group)
          if (items.length === 0) return null
          return (
            <SelectGroup key={group}>
              <SelectLabel>{group}</SelectLabel>
              {items.map((item) => {
                const Icon = menuIcons[item.value]
                return (
                  <SelectItem key={item.value} value={item.value}>
                    <span className="flex items-center gap-2">
                      <Icon className="size-4" />
                      {item.label}
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
