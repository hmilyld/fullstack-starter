import * as React from "react"
import { useSearchParams } from "react-router"
import {
  RotateCcwIcon,
  SearchIcon,
  SearchXIcon,
  ShieldAlertIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react"

import { ColumnToggle } from "@/components/shared/column-toggle"
import { DensityToggle } from "@/components/shared/density-toggle"
import { DataList, type DataColumn } from "@/components/shared/data-list"
import { ListShell } from "@/components/shared/list-shell"
import { PageHeader } from "@/components/shared/page-header"
import { RecordCard } from "@/components/shared/record-card"
import { TablePagination } from "@/components/shared/table-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAuditLogs } from "@/api/audit-log"
import { useColumnVisibility } from "@/hooks/use-column-visibility"
import { useTableDensity } from "@/hooks/use-table-density"
import { usePagedList } from "@/hooks/use-paged-list"
import { useUrlPage } from "@/hooks/use-url-list-state"
import { formatDateTime } from "@/lib/format"
import type { AuditFilterKey, AuditFilters, AuditLog } from "@/types/audit-log"

const DEFAULT_PAGE_SIZE = 10
const PAGE_SIZE_OPTIONS = [10, 20, 50]

const EMPTY_FILTERS: AuditFilters = {
  userId: "",
  status: "",
  action: "",
  startTime: "",
  endTime: "",
}

const FILTER_LABELS: Record<AuditFilterKey, string> = {
  userId: "用户 ID",
  status: "状态",
  action: "动作",
  startTime: "开始时间",
  endTime: "结束时间",
}

const STATUS_LABELS: Record<string, string> = {
  success: "成功",
  fail: "失败",
  permission_denied: "权限不足",
}

function getStatusBadge(status: AuditLog["status"]) {
  if (status === "success") return <Badge variant="success">成功</Badge>
  if (status === "fail") return <Badge variant="destructive">失败</Badge>
  return <Badge variant="warning">权限不足</Badge>
}

function formatFilterValue(key: AuditFilterKey, value: string) {
  if (key === "status") return STATUS_LABELS[value] ?? value
  if (key === "startTime" || key === "endTime") return formatDateTime(value)
  return value
}

const FILTER_KEYS: AuditFilterKey[] = [
  "userId",
  "status",
  "action",
  "startTime",
  "endTime",
]

export function AuditLogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query: AuditFilters = {
    userId: searchParams.get("userId") ?? "",
    status: searchParams.get("status") ?? "",
    action: searchParams.get("action") ?? "",
    startTime: searchParams.get("startTime") ?? "",
    endTime: searchParams.get("endTime") ?? "",
  }
  const queryKey = JSON.stringify(query)
  const { page, setPage } = useUrlPage()
  const [draft, setDraft] = React.useState<AuditFilters>(query)
  const [filterOpen, setFilterOpen] = React.useState(false)
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE)
  const list = usePagedList<AuditLog, AuditFilters>({
    fetcher: getAuditLogs,
    params: query,
    pageSize,
    page,
    onPageChange: setPage,
  })

  // 浏览器前进/后退或外部链接改变筛选条件时，同步表单草稿
  React.useEffect(() => {
    setDraft(JSON.parse(queryKey) as AuditFilters)
  }, [queryKey])

  function writeFilters(filters: AuditFilters) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const key of FILTER_KEYS) {
          if (filters[key]) next.set(key, filters[key])
          else next.delete(key)
        }
        next.delete("page")
        return next
      },
      { replace: true }
    )
  }

  function updateDraft(key: AuditFilterKey, value: string) {
    setDraft((previous) => ({ ...previous, [key]: value }))
  }

  function handleSearch() {
    writeFilters({
      userId: draft.userId.trim(),
      status: draft.status,
      action: draft.action.trim(),
      startTime: draft.startTime,
      endTime: draft.endTime,
    })
  }

  function handleReset() {
    setDraft(EMPTY_FILTERS)
    writeFilters(EMPTY_FILTERS)
  }

  function writeSingleFilter(key: AuditFilterKey, value: string) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(key, value)
        else next.delete(key)
        next.delete("page")
        return next
      },
      { replace: true }
    )
  }

  function removeFilter(key: AuditFilterKey) {
    setDraft((previous) => ({ ...previous, [key]: "" }))
    writeSingleFilter(key, "")
  }

  const activeFilters = (Object.keys(query) as AuditFilterKey[])
    .filter((key) => query[key] !== "")
    .map((key) => ({
      key,
      label: FILTER_LABELS[key],
      value: formatFilterValue(key, query[key]),
    }))

  function renderFilterFields(prefix: string) {
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <Field>
          <FieldLabel htmlFor={`${prefix}-user`}>用户 ID</FieldLabel>
          <Input
            name="audit-user"
            autoComplete="off"
            spellCheck={false}
            id={`${prefix}-user`}
            value={draft.userId}
            placeholder="例如：1"
            onChange={(event) => updateDraft("userId", event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>状态</FieldLabel>
          <Select
            value={draft.status || "all"}
            onValueChange={(value) =>
              updateDraft("status", value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-full" aria-label="状态">
              <SelectValue placeholder="全部状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="success">成功</SelectItem>
                <SelectItem value="fail">失败</SelectItem>
                <SelectItem value="permission_denied">权限不足</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-action`}>动作</FieldLabel>
          <Input
            name="audit-action"
            autoComplete="off"
            spellCheck={false}
            id={`${prefix}-action`}
            value={draft.action}
            placeholder="例如：users.create"
            onChange={(event) => updateDraft("action", event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-start`}>开始时间</FieldLabel>
          <Input
            name="audit-start"
            autoComplete="off"
            id={`${prefix}-start`}
            type="datetime-local"
            value={draft.startTime}
            onChange={(event) => updateDraft("startTime", event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-end`}>结束时间</FieldLabel>
          <Input
            name="audit-end"
            autoComplete="off"
            id={`${prefix}-end`}
            type="datetime-local"
            value={draft.endTime}
            onChange={(event) => updateDraft("endTime", event.target.value)}
          />
        </Field>
      </div>
    )
  }

  const columns: DataColumn<AuditLog>[] = [
    {
      key: "createdAt",
      header: "时间",
      cellClassName: "whitespace-nowrap text-muted-foreground",
      cell: (log) => formatDateTime(log.createdAt),
    },
    {
      key: "username",
      header: "操作者",
      hideable: true,
      headClassName: "hidden md:table-cell",
      cellClassName: "hidden md:table-cell",
      cell: (log) => log.username || "未知",
    },
    {
      key: "action",
      header: "动作",
      cellClassName: "font-mono text-xs",
      cell: (log) => log.action,
    },
    {
      key: "ip",
      header: "IP",
      hideable: true,
      headClassName: "hidden lg:table-cell",
      cellClassName: "hidden text-muted-foreground lg:table-cell",
      cell: (log) => log.ip || "-",
    },
    {
      key: "status",
      header: "状态",
      cell: (log) => getStatusBadge(log.status),
    },
    {
      key: "detail",
      header: "详情",
      hideable: true,
      headClassName: "hidden xl:table-cell",
      cellClassName:
        "hidden max-w-[240px] truncate text-muted-foreground xl:table-cell",
      cell: (log) => log.detail || "-",
    },
  ]

  const table = useColumnVisibility("audit-logs", columns)
  const { density, setDensity } = useTableDensity("audit-logs")

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <PageHeader
        title="审计日志"
        description="查看系统的写操作与权限拦截记录。"
      />

      <ListShell
        description={`共 ${list.total} 条记录`}
        footer={
          list.items.length > 0 ? (
            <TablePagination
              page={list.page}
              totalPages={list.totalPages}
              total={list.total}
              itemLabel="条记录"
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(1)
              }}
              onPageChange={list.setPage}
            />
          ) : null
        }
      >
        <div className="flex flex-col gap-3 pb-4">
          <div className="hidden flex-col gap-3 md:flex">
            {renderFilterFields("audit")}
            <div className="flex items-center gap-2">
              <Button onClick={handleSearch}>
                <SearchIcon data-icon="inline-start" />
                查询
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcwIcon data-icon="inline-start" />
                重置
              </Button>
              <ColumnToggle
                columns={columns}
                hidden={table.hidden}
                onToggle={table.toggle}
                onReset={table.reset}
              />
              <DensityToggle density={density} onChange={setDensity} />
            </div>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setFilterOpen(true)}
            >
              <SlidersHorizontalIcon data-icon="inline-start" />
              筛选
              {activeFilters.length > 0 ? ` · ${activeFilters.length}` : ""}
            </Button>
            <Button className="flex-1" onClick={handleSearch}>
              <SearchIcon data-icon="inline-start" />
              查询
            </Button>
          </div>
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">当前筛选：</span>
              {activeFilters.map((filter) => (
                <Button
                  key={filter.key}
                  variant="secondary"
                  size="xs"
                  onClick={() => removeFilter(filter.key)}
                  aria-label={`移除筛选：${filter.label}`}
                >
                  {filter.label}：{filter.value}
                  <XIcon data-icon="inline-end" />
                </Button>
              ))}
              <Button variant="ghost" size="xs" onClick={handleReset}>
                清除全部
              </Button>
            </div>
          )}
        </div>

        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetContent
            side="bottom"
            className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0"
          >
            <SheetHeader className="border-b p-4 pr-14">
              <SheetTitle>筛选条件</SheetTitle>
              <SheetDescription>
                按用户、状态、动作或时间范围筛选审计记录。
              </SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
              {renderFilterFields("audit-mobile")}
            </div>
            <SheetFooter className="flex-row gap-2 border-t p-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  handleReset()
                  setFilterOpen(false)
                }}
              >
                重置
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  handleSearch()
                  setFilterOpen(false)
                }}
              >
                应用筛选
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <DataList
          items={list.items}
          loading={list.loading}
          error={list.error}
          onRetry={list.refresh}
          skeletonColSpan={6}
          getKey={(log) => log.id}
          onHideColumn={table.toggle}
          empty={{
            icon: activeFilters.length > 0 ? SearchXIcon : ShieldAlertIcon,
            title:
              activeFilters.length > 0
                ? "没有符合条件的记录"
                : "还没有审计记录",
            description:
              activeFilters.length > 0
                ? "试着放宽筛选条件，或清除筛选后重试。"
                : "系统的写操作和权限拦截会自动记录在这里。",
            action:
              activeFilters.length > 0 ? (
                <Button variant="outline" onClick={handleReset}>
                  清除筛选
                </Button>
              ) : null,
          }}
          renderCard={(log) => (
            <RecordCard
              key={log.id}
              title={log.action}
              badges={getStatusBadge(log.status)}
              subtitle={formatDateTime(log.createdAt)}
              meta={
                <>
                  <span>{log.username || "未知"}</span>
                  <span>{log.ip || "-"}</span>
                  {log.detail && (
                    <span className="w-full truncate">{log.detail}</span>
                  )}
                </>
              }
            />
          )}
          columns={table.visibleColumns}
          density={density}
        />
      </ListShell>
    </div>
  )
}
