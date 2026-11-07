import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type ListShellProps = {
  title: string
  description?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}

/** 列表页统一外壳：卡片头（标题/说明/工具栏）+ 内容 + 底部分页 */
export function ListShell({
  title,
  description,
  actions,
  footer,
  children,
  className,
}: ListShellProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {actions && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {actions}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {children}
        {footer && <div className="pt-4">{footer}</div>}
      </CardContent>
    </Card>
  )
}
