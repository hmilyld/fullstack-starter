import * as React from "react"
import { useTranslation } from "react-i18next"
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
import { DateTimeField } from "@/components/shared/date-time-field"
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
import { formatDateTimeInput, type DateTimeLocale } from "@/lib/date-time"
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

const FILTER_KEYS: AuditFilterKey[] = [
  "userId",
  "status",
  "action",
  "startTime",
  "endTime",
]

export function AuditLogPage() {
  const { t, i18n } = useTranslation()
  const locale: DateTimeLocale = i18n.resolvedLanguage === "en" ? "en" : "zh-CN"
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

  function filterLabel(key: AuditFilterKey) {
    return t(`auditLogPage.filters.${key}`)
  }

  function statusLabel(status: string) {
    return t(`auditLogPage.status.${status}`, { defaultValue: status })
  }

  function getStatusBadge(status: AuditLog["status"]) {
    if (status === "success")
      return <Badge variant="success">{statusLabel(status)}</Badge>
    if (status === "fail")
      return <Badge variant="destructive">{statusLabel(status)}</Badge>
    return <Badge variant="warning">{statusLabel(status)}</Badge>
  }

  function formatFilterValue(key: AuditFilterKey, value: string) {
    if (key === "status") return statusLabel(value)
    if (key === "startTime" || key === "endTime")
      return formatDateTimeInput(value, locale)
    return value
  }

  const activeFilters = (Object.keys(query) as AuditFilterKey[])
    .filter((key) => query[key] !== "")
    .map((key) => ({
      key,
      label: filterLabel(key),
      value: formatFilterValue(key, query[key]),
    }))

  function renderFilterFields(prefix: string) {
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <Field>
          <FieldLabel htmlFor={`${prefix}-user`}>
            {t("auditLogPage.filters.userId")}
          </FieldLabel>
          <Input
            name="audit-user"
            autoComplete="off"
            spellCheck={false}
            id={`${prefix}-user`}
            value={draft.userId}
            placeholder={t("auditLogPage.userPlaceholder")}
            onChange={(event) => updateDraft("userId", event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>{t("auditLogPage.filters.status")}</FieldLabel>
          <Select
            value={draft.status || "all"}
            onValueChange={(value) =>
              updateDraft("status", value === "all" ? "" : value)
            }
          >
            <SelectTrigger
              className="w-full"
              aria-label={t("auditLogPage.filters.status")}
            >
              <SelectValue placeholder={t("auditLogPage.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">
                  {t("auditLogPage.allStatuses")}
                </SelectItem>
                <SelectItem value="success">
                  {t("auditLogPage.status.success")}
                </SelectItem>
                <SelectItem value="fail">
                  {t("auditLogPage.status.fail")}
                </SelectItem>
                <SelectItem value="permission_denied">
                  {t("auditLogPage.status.permission_denied")}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-action`}>
            {t("auditLogPage.filters.action")}
          </FieldLabel>
          <Input
            name="audit-action"
            autoComplete="off"
            spellCheck={false}
            id={`${prefix}-action`}
            value={draft.action}
            placeholder={t("auditLogPage.actionPlaceholder")}
            onChange={(event) => updateDraft("action", event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-start`}>
            {t("auditLogPage.filters.startTime")}
          </FieldLabel>
          <DateTimeField
            id={`${prefix}-start`}
            name="audit-start"
            value={draft.startTime}
            onChange={(value) => updateDraft("startTime", value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-end`}>
            {t("auditLogPage.filters.endTime")}
          </FieldLabel>
          <DateTimeField
            id={`${prefix}-end`}
            name="audit-end"
            value={draft.endTime}
            onChange={(value) => updateDraft("endTime", value)}
          />
        </Field>
      </div>
    )
  }

  const columns: DataColumn<AuditLog>[] = [
    {
      key: "createdAt",
      header: t("auditLogPage.columns.time"),
      cellClassName: "whitespace-nowrap text-muted-foreground",
      cell: (log) => formatDateTime(log.createdAt, locale),
    },
    {
      key: "username",
      header: t("auditLogPage.columns.username"),
      hideable: true,
      headClassName: "hidden md:table-cell",
      cellClassName: "hidden md:table-cell",
      cell: (log) => log.username || t("auditLogPage.unknown"),
    },
    {
      key: "action",
      header: t("auditLogPage.columns.action"),
      cellClassName: "font-mono text-xs",
      cell: (log) => log.action,
    },
    {
      key: "ip",
      header: t("auditLogPage.columns.ip"),
      hideable: true,
      headClassName: "hidden lg:table-cell",
      cellClassName: "hidden text-muted-foreground lg:table-cell",
      cell: (log) => log.ip || "-",
    },
    {
      key: "status",
      header: t("auditLogPage.columns.status"),
      cell: (log) => getStatusBadge(log.status),
    },
    {
      key: "detail",
      header: t("auditLogPage.columns.detail"),
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
        title={t("auditLogPage.title")}
        description={t("auditLogPage.description")}
      />

      <ListShell
        description={t("auditLogPage.listDescription", {
          total: list.total,
        })}
        footer={
          list.items.length > 0 ? (
            <TablePagination
              page={list.page}
              totalPages={list.totalPages}
              total={list.total}
              itemLabel={t("auditLogPage.entityName")}
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
                {t("auditLogPage.search")}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcwIcon data-icon="inline-start" />
                {t("auditLogPage.reset")}
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
              {t("auditLogPage.filterButton")}
              {activeFilters.length > 0 ? ` · ${activeFilters.length}` : ""}
            </Button>
            <Button className="flex-1" onClick={handleSearch}>
              <SearchIcon data-icon="inline-start" />
              {t("auditLogPage.search")}
            </Button>
          </div>
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {t("auditLogPage.currentFilters")}
              </span>
              {activeFilters.map((filter) => (
                <Button
                  key={filter.key}
                  variant="secondary"
                  size="xs"
                  onClick={() => removeFilter(filter.key)}
                  aria-label={t("auditLogPage.removeFilterAria", {
                    label: filter.label,
                  })}
                >
                  {filter.label}
                  {t("auditLogPage.filterSeparator")}
                  {filter.value}
                  <XIcon data-icon="inline-end" />
                </Button>
              ))}
              <Button variant="ghost" size="xs" onClick={handleReset}>
                {t("auditLogPage.clearAll")}
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
              <SheetTitle>{t("auditLogPage.sheetTitle")}</SheetTitle>
              <SheetDescription>
                {t("auditLogPage.sheetDescription")}
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
                {t("auditLogPage.reset")}
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  handleSearch()
                  setFilterOpen(false)
                }}
              >
                {t("auditLogPage.apply")}
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
                ? t("auditLogPage.emptySearchTitle")
                : t("auditLogPage.emptyTitle"),
            description:
              activeFilters.length > 0
                ? t("auditLogPage.emptySearchDescription")
                : t("auditLogPage.emptyDescription"),
            action:
              activeFilters.length > 0 ? (
                <Button variant="outline" onClick={handleReset}>
                  {t("auditLogPage.clearFilter")}
                </Button>
              ) : null,
          }}
          renderCard={(log) => (
            <RecordCard
              key={log.id}
              title={log.action}
              badges={getStatusBadge(log.status)}
              subtitle={formatDateTime(log.createdAt, locale)}
              meta={
                <>
                  <span>{log.username || t("auditLogPage.unknown")}</span>
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
