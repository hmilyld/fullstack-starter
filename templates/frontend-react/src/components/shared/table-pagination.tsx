import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type TablePaginationProps = {
  page: number
  totalPages: number
  total: number
  itemLabel?: string
  /** 传入 pageSize + onPageSizeChange 时显示「每页条数」选择器 */
  pageSize?: number
  pageSizeOptions?: number[]
  onPageSizeChange?: (pageSize: number) => void
  onPageChange: (page: number) => void
}

function getPageItems(page: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const visible = Array.from(new Set([1, totalPages, page - 1, page, page + 1]))
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b)

  const result: (number | "ellipsis")[] = []
  let previous = 0
  for (const value of visible) {
    if (value - previous > 1) result.push("ellipsis")
    result.push(value)
    previous = value
  }
  return result
}

export function TablePagination({
  page,
  totalPages,
  total,
  itemLabel = "条记录",
  pageSize,
  pageSizeOptions = [10, 20, 50],
  onPageSizeChange,
  onPageChange,
}: TablePaginationProps) {
  const pageItems = getPageItems(page, totalPages)
  const showPageSize = pageSize !== undefined && onPageSizeChange !== undefined

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <p>
          共 {total} {itemLabel}，第 {page} / {totalPages} 页
        </p>
        {showPageSize && (
          <label className="flex items-center gap-2 text-xs">
            每页
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger
                size="sm"
                className="h-8 w-[76px]"
                aria-label="每页显示条数"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option} 条
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        )}
      </div>
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem className="hidden md:flex">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={page <= 1}
              onClick={() => onPageChange(1)}
              aria-label="第一页"
            >
              <ChevronsLeftIcon />
            </Button>
          </PaginationItem>
          <PaginationItem>
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeftIcon data-icon="inline-start" />
              上一页
            </Button>
          </PaginationItem>
          {pageItems.map((item, index) =>
            item === "ellipsis" ? (
              <PaginationItem
                key={`ellipsis-${index}`}
                className="hidden md:flex"
              >
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item} className="hidden md:flex">
                <Button
                  variant={item === page ? "outline" : "ghost"}
                  size="icon-sm"
                  aria-current={item === page ? "page" : undefined}
                  onClick={() => onPageChange(item)}
                >
                  {item}
                </Button>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              下一页
              <ChevronRightIcon data-icon="inline-end" />
            </Button>
          </PaginationItem>
          <PaginationItem className="hidden md:flex">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(totalPages)}
              aria-label="最后一页"
            >
              <ChevronsRightIcon />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
