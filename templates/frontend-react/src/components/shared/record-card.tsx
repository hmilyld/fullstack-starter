import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type RecordCardProps = {
  title: ReactNode
  subtitle?: ReactNode
  meta?: ReactNode
  badges?: ReactNode
  actions?: ReactNode
  className?: string
}

/** 手机端列表卡片：主信息 + 次要信息 + 状态 + 操作 */
export function RecordCard({
  title,
  subtitle,
  meta,
  badges,
  actions,
  className,
}: RecordCardProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-2xl border bg-card p-4",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="min-w-0 truncate text-sm font-medium">{title}</span>
          {badges}
        </div>
        {subtitle && (
          <span className="truncate text-sm text-muted-foreground">
            {subtitle}
          </span>
        )}
        {meta && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {meta}
          </div>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}
