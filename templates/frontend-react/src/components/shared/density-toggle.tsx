import { useTranslation } from "react-i18next"
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

const OPTIONS: { value: TableDensity; labelKey: string }[] = [
  { value: "comfortable", labelKey: "common.table.comfortable" },
  { value: "compact", labelKey: "common.table.compact" },
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
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={t("common.table.density")}
          title={t("common.table.density")}
          className={cn(className)}
        >
          <Rows3Icon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuLabel>{t("common.table.density")}</DropdownMenuLabel>
        {OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => onChange(option.value)}
          >
            <span className="flex size-4 items-center justify-center">
              {density === option.value && <CheckIcon className="size-4" />}
            </span>
            {t(option.labelKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
