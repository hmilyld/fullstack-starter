import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type ListShellProps = {
  /** 左侧的计数/统计说明，如「共 5 位用户」 */
  description?: ReactNode
  /** 右侧工具栏：搜索、列、主操作 */
  actions?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * 列表页统一外壳：工具栏（计数 + 操作）+ 内容 + 分页。
 * 不再套卡片、不再重复页面标题——表格由 DataList 自带边框容器。
 */
export function ListShell({
  description,
  actions,
  footer,
  children,
  className,
}: ListShellProps) {
  const hasToolbar = description !== undefined || actions !== undefined

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {hasToolbar && (
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          {actions && (
            <div className="flex flex-col gap-2 md:ml-auto md:flex-row md:items-center">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
      {footer && <div>{footer}</div>}
    </div>
  )
}
