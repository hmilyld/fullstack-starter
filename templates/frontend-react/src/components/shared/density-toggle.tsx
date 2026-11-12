import { CheckIcon, Rows3Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { TableDensity } from "@/hooks/use-table-density"

const OPTIONS: { value: TableDensity; label: string }[] = [
  { value: "comfortable", label: "舒适" },
  { value: "compact", label: "紧凑" },
]

export function DensityToggle({
  density,
  onChange,
  className,
}: {
  density: TableDensity
  onChange: (density: TableDensity) => void
  className?: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="表格密度"
          title="表格密度"
          className={cn(className)}
        >
          <Rows3Icon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuLabel>表格密度</DropdownMenuLabel>
        {OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => onChange(option.value)}
          >
            <span className="flex size-4 items-center justify-center">
              {density === option.value && <CheckIcon className="size-4" />}
            </span>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
