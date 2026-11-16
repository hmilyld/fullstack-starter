import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { Loader2Icon } from "lucide-react"

type SpinnerProps = React.ComponentProps<"svg"> & {
  /** 放在已有文字或 aria-busy 的控件内时，不要再重复播报 */
  decorative?: boolean
}

function Spinner({ className, decorative = false, ...props }: SpinnerProps) {
  const { t } = useTranslation()

  return (
    <Loader2Icon
      data-slot="spinner"
      role={decorative ? undefined : "status"}
      aria-label={decorative ? undefined : t("common.loading")}
      aria-hidden={decorative || undefined}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
