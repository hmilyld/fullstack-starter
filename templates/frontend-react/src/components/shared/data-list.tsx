import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { InlineError } from "@/components/shared/inline-error"
import { TableSkeletonRow } from "@/components/shared/table-states"

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
  /** 手机端的卡片形态；桌面端由 children 提供表格 */
  renderCard: (item: T) => React.ReactNode
  skeletonColSpan?: number
  children: React.ReactNode
}

/**
 * 列表页的统一状态机：错误 / 加载 / 空态 / 手机卡片 + 桌面表格。
 * 页面只负责「一行长什么样」，不再各自复制这套分支。
 */
export function DataList<T>({
  items,
  loading,
  error,
  onRetry,
  empty,
  getKey,
  renderCard,
  skeletonColSpan = 5,
  children,
}: DataListProps<T>) {
  const hasItems = items.length > 0

  return (
    <>
      {error && hasItems && <InlineError message={error} onRetry={onRetry} />}

      {loading && !hasItems ? (
        <TableSkeletonRow colSpan={skeletonColSpan} />
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
          <div className="hidden md:block">{children}</div>
        </>
      )}
    </>
  )
}
