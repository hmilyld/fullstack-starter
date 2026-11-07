import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { iconOptions, menuIcons } from "@/lib/icons"

export { MenuIcon } from "@/lib/icons"

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
      <SelectContent>
        <SelectGroup>
          {iconOptions.map((item) => {
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
      </SelectContent>
    </Select>
  )
}
