import * as React from "react"
import { MoreHorizontalIcon, type LucideIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { InlineError } from "@/components/shared/inline-error"
import { TableSkeletonRow } from "@/components/shared/table-states"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { TableDensity } from "@/hooks/use-table-density"
import { cn } from "@/lib/utils"

export type DataColumn<T> = {
  key: string
  header: React.ReactNode
  cell: (item: T) => React.ReactNode
  /** 可在「列」菜单里隐藏 */
  hideable?: boolean
  /** 默认隐藏（低优先级列） */
  defaultHidden?: boolean
  headClassName?: string
  cellClassName?: string
  /** 操作列固定在右侧 */
  pinRight?: boolean
}

export type DataListEmpty = {
  icon?: LucideIcon
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
}

type DataListProps<T> = {
  items: T[]
  loading: boolean
  error: string | null
  onRetry: () => void
  empty: DataListEmpty
  getKey: (item: T) => string
  /** 手机端的卡片形态 */
  renderCard: (item: T) => React.ReactNode
  /** 桌面端的列定义（已按显隐过滤） */
  columns: DataColumn<T>[]
  /** 传了就会在可隐藏列的列头显示「隐藏此列」 */
  onHideColumn?: (key: string) => void
  /** 表头吸顶（页面滚动场景默认开；弹窗内关闭） */
  stickyHeader?: boolean
  /** 表格外部边框容器（弹窗内关闭） */
  bordered?: boolean
  /** 行密度，紧凑时压缩单元格上下留白 */
  density?: TableDensity
  skeletonColSpan?: number
}

/**
 * 列表页的统一状态机与表格渲染：错误 / 加载 / 空态 / 手机卡片 + 桌面表格。
 * 页面只提供列定义与卡片形态，不再各自复制表格与分支。
 */
export function DataList<T>({
  items,
  loading,
  error,
  onRetry,
  empty,
  getKey,
  renderCard,
  columns,
  onHideColumn,
  stickyHeader = true,
  bordered = true,
  density = "comfortable",
  skeletonColSpan = 5,
}: DataListProps<T>) {
  const hasItems = items.length > 0

  return (
    <>
      {error && hasItems && <InlineError message={error} onRetry={onRetry} />}

      {loading && !hasItems ? (
        <div className="overflow-clip rounded-xl border bg-card max-md:rounded-none max-md:border-0">
          <TableSkeletonRow colSpan={skeletonColSpan} />
        </div>
      ) : error && !hasItems ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : !hasItems ? (
        <EmptyState
          icon={empty.icon}
          title={empty.title}
          description={empty.description}
          action={empty.action}
        />
      ) : (
        <>
          <div className="flex flex-col gap-2 md:hidden">
            {items.map((item) => (
              <React.Fragment key={getKey(item)}>
                {renderCard(item)}
              </React.Fragment>
            ))}
          </div>
          <div
            data-density={density}
            className={cn(
              "hidden md:block",
              bordered && "overflow-clip rounded-xl border bg-card",
              density === "compact" && "[&_td]:py-1.5 [&_th]:h-9"
            )}
          >
            <Table sticky>
              <TableHeader
                className={cn(
                  "[&_th]:border-b [&_th]:border-border [&_th]:bg-card",
                  stickyHeader && "[&_th]:sticky [&_th]:top-16 [&_th]:z-10"
                )}
              >
                <TableRow>
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={cn(
                        column.headClassName,
                        column.pinRight && "sticky right-0 bg-card"
                      )}
                    >
                      <div className="group/col flex items-center gap-1">
                        <span className="min-w-0 truncate">
                          {column.header}
                        </span>
                        {column.hideable && onHideColumn && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                aria-label="列选项"
                                className="-mr-1 opacity-0 transition-opacity group-hover/col:opacity-100 focus-visible:opacity-100 [@media(pointer:coarse)]:opacity-100"
                              >
                                <MoreHorizontalIcon />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem
                                onSelect={() => onHideColumn(column.key)}
                              >
                                隐藏此列
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={getKey(item)}>
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn(
                          column.cellClassName,
                          column.pinRight && "sticky right-0 bg-inherit"
                        )}
                      >
                        {column.cell(item)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </>
  )
}
