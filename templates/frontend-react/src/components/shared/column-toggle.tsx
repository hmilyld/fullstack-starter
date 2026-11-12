import { Columns3Icon } from "lucide-react"

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type ColumnToggleProps = {
  columns: { key: string; header: React.ReactNode; hideable?: boolean }[]
  hidden: string[]
  onToggle: (key: string) => void
  onReset: () => void
  className?: string
}

export function ColumnToggle({
  columns,
  hidden,
  onToggle,
  onReset,
  className,
}: ColumnToggleProps) {
  const hideable = columns.filter((column) => column.hideable)
  if (hideable.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn("w-full md:w-fit", className)}>
          <Columns3Icon data-icon="inline-start" />列
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>显示列</DropdownMenuLabel>
        {hideable.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.key}
            checked={!hidden.includes(column.key)}
            onCheckedChange={() => onToggle(column.key)}
            onSelect={(event) => event.preventDefault()}
          >
            {column.header}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onReset}>恢复默认</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
