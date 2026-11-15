import { useTranslation } from "react-i18next"
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
  itemLabel,
  pageSize,
  pageSizeOptions = [10, 20, 50],
  onPageSizeChange,
  onPageChange,
}: TablePaginationProps) {
  const { t } = useTranslation()
  const label = itemLabel ?? t("common.pagination.records")
  const pageItems = getPageItems(page, totalPages)
  const showPageSize = pageSize !== undefined && onPageSizeChange !== undefined

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <p>
          {t("common.pagination.summary", {
            total,
            itemLabel: label,
            page,
            totalPages,
          })}
        </p>
        {showPageSize && (
          <label className="flex items-center gap-2 text-xs">
            {t("common.pagination.perPage")}
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger
                size="sm"
                className="h-8 w-[76px]"
                aria-label={t("common.pagination.perPageAria")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {t("common.pagination.items", { count: option })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        )}
      </div>
      <Pagination className="md:mx-0 md:w-auto md:justify-end">
        <PaginationContent>
          <PaginationItem className="hidden md:flex">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={page <= 1}
              onClick={() => onPageChange(1)}
              aria-label={t("common.pagination.first")}
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
              {t("common.pagination.previous")}
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
                  variant={item === page ? "default" : "ghost"}
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
              {t("common.pagination.next")}
              <ChevronRightIcon data-icon="inline-end" />
            </Button>
          </PaginationItem>
          <PaginationItem className="hidden md:flex">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(totalPages)}
              aria-label={t("common.pagination.last")}
            >
              <ChevronsRightIcon />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
