<script lang="ts">
  import { page as appPage } from "$app/state"
  import { goto } from "$app/navigation"
  import { resolve } from "$app/paths"
  import {
    RotateCcw,
    Search,
    SearchX,
    ShieldAlert,
    SlidersHorizontal,
    X,
  } from "@lucide/svelte"
  import AuditFilterFields from "./AuditFilterFields.svelte"
  import ColumnToggle from "#lib/components/shared/column-toggle.svelte"
  import DataList from "#lib/components/shared/data-list.svelte"
  import DensityToggle from "#lib/components/shared/density-toggle.svelte"
  import ListShell from "#lib/components/shared/list-shell.svelte"
  import PageHeader from "#lib/components/shared/page-header.svelte"
  import RecordCard from "#lib/components/shared/record-card.svelte"
  import TablePagination from "#lib/components/shared/table-pagination.svelte"
  import type { DataColumn } from "#lib/components/shared/data-column.js"
  import { Badge } from "#lib/components/ui/badge/index.js"
  import { Button } from "#lib/components/ui/button/index.js"
  import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
  } from "#lib/components/ui/sheet/index.js"
  import { getAuditLogs } from "#lib/api/audit-log.js"
  import { formatDateTimeInput } from "#lib/date-time.js"
  import { formatDateTime } from "#lib/format.js"
  import { useColumnVisibility } from "#lib/hooks/use-column-visibility.svelte.js"
  import { usePagedList } from "#lib/hooks/use-paged-list.svelte.js"
  import { useTableDensity } from "#lib/hooks/use-table-density.svelte.js"
  import { useUrlPage } from "#lib/hooks/use-url-list-state.svelte.js"
  import type {
    AuditFilterKey,
    AuditFilters,
    AuditLog,
  } from "#lib/types/audit-log.js"

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

  const FILTER_KEYS: AuditFilterKey[] = [
    "userId",
    "status",
    "action",
    "startTime",
    "endTime",
  ]

  type AuditLogPath = "settings/audit-log" | `settings/audit-log?${string}`

  const columns: DataColumn[] = [
    {
      key: "createdAt",
      header: "时间",
      cellClass: "whitespace-nowrap text-muted-foreground",
    },
    {
      key: "username",
      header: "操作者",
      hideable: true,
      headClass: "hidden md:table-cell",
      cellClass: "hidden md:table-cell",
    },
    { key: "action", header: "动作", cellClass: "font-mono text-xs" },
    {
      key: "ip",
      header: "IP",
      hideable: true,
      headClass: "hidden lg:table-cell",
      cellClass: "hidden text-muted-foreground lg:table-cell",
    },
    { key: "status", header: "状态" },
    {
      key: "detail",
      header: "详情",
      hideable: true,
      headClass: "hidden xl:table-cell",
      cellClass:
        "hidden max-w-[240px] truncate text-muted-foreground xl:table-cell",
    },
  ]

  function readQuery(input: string | null): string {
    return input ?? ""
  }

  function readFilters(): AuditFilters {
    const params = appPage.url.searchParams
    return {
      userId: readQuery(params.get("userId")),
      status: readQuery(params.get("status")),
      action: readQuery(params.get("action")),
      startTime: readQuery(params.get("startTime")),
      endTime: readQuery(params.get("endTime")),
    }
  }

  const urlPage = useUrlPage()
  const query = $derived(readFilters())

  let draft = $state<AuditFilters>(readFilters())
  let filterOpen = $state(false)
  let pageSize = $state(DEFAULT_PAGE_SIZE)

  const list = usePagedList<AuditLog, AuditFilters>({
    fetcher: getAuditLogs,
    params: () => query,
    pageSize: () => pageSize,
    page: () => urlPage.page,
    onPageChange: urlPage.setPage,
  })

  const logs = $derived(list.items)
  const total = $derived(list.total)
  const currentPage = $derived(list.page)
  const totalPages = $derived(list.totalPages)
  const listLoading = $derived(list.loading)
  const listError = $derived(list.error)
  const hasLogs = $derived(logs.length > 0)

  // 浏览器前进/后退或外部链接改变筛选条件时，同步表单草稿
  $effect(() => {
    const value = query
    draft = { ...value }
  })

  const columnState = useColumnVisibility("audit-logs", () => columns)
  const densityState = useTableDensity("audit-logs")

  function navigateToFilters(url: URL) {
    const search = url.searchParams.toString()
    const target: AuditLogPath = search
      ? `settings/audit-log?${search}`
      : "settings/audit-log"
    void goto(resolve(target), { replace: true, reset: false })
  }

  function writeFilters(filters: AuditFilters) {
    const url = new URL(appPage.url.href)
    for (const key of FILTER_KEYS) {
      if (filters[key]) url.searchParams.set(key, filters[key])
      else url.searchParams.delete(key)
    }
    url.searchParams.delete("page")
    navigateToFilters(url)
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
    draft = { ...EMPTY_FILTERS }
    writeFilters(EMPTY_FILTERS)
  }

  function searchAndClose() {
    handleSearch()
    filterOpen = false
  }

  function resetAndClose() {
    handleReset()
    filterOpen = false
  }

  function removeFilter(key: AuditFilterKey) {
    draft = { ...draft, [key]: "" }
    const url = new URL(appPage.url.href)
    url.searchParams.delete(key)
    url.searchParams.delete("page")
    navigateToFilters(url)
  }

  function formatFilterValue(key: AuditFilterKey, value: string) {
    if (key === "status") return STATUS_LABELS[value] ?? value
    if (key === "startTime" || key === "endTime")
      return formatDateTimeInput(value)
    return value
  }

  const activeFilters = $derived(
    (Object.keys(query) as AuditFilterKey[])
      .filter((key) => query[key] !== "")
      .map((key) => ({
        key,
        label: FILTER_LABELS[key],
        value: formatFilterValue(key, query[key]),
      }))
  )

  function statusLabel(status: AuditLog["status"]) {
    return STATUS_LABELS[status] ?? status
  }

  function statusBadgeVariant(
    status: AuditLog["status"]
  ): "success" | "destructive" | "warning" {
    if (status === "success") return "success"
    if (status === "fail") return "destructive"
    return "warning"
  }
</script>

<svelte:head><title>审计日志 · 管理系统</title></svelte:head>

{#snippet statusBadge(row: AuditLog)}
  <Badge variant={statusBadgeVariant(row.status)}>
    {statusLabel(row.status)}
  </Badge>
{/snippet}

<div class="flex flex-col gap-(--page-gap)">
  <PageHeader title="审计日志" description="查看系统的写操作与权限拦截记录。" />

  <ListShell description={`共 ${total} 条记录`}>
    {#snippet footer()}
      {#if hasLogs}
        <TablePagination
          page={currentPage}
          {totalPages}
          {total}
          itemLabel="条记录"
          {pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageChange={list.setPage}
          onPageSizeChange={(size) => {
            pageSize = size
            list.setPage(1)
          }}
        />
      {/if}
    {/snippet}

    <div class="flex flex-col gap-3 pb-4">
      <div class="hidden flex-col gap-3 md:flex">
        <AuditFilterFields bind:value={draft} prefix="audit" />
        <div class="flex items-center gap-2">
          <Button onclick={handleSearch}>
            <Search data-icon="inline-start" />
            查询
          </Button>
          <Button variant="outline" onclick={handleReset}>
            <RotateCcw data-icon="inline-start" />
            重置
          </Button>
          <ColumnToggle
            {columns}
            hidden={columnState.hidden}
            onToggle={columnState.toggle}
            onReset={columnState.reset}
          />
          <DensityToggle
            density={densityState.density}
            onChange={densityState.setDensity}
          />
        </div>
      </div>
      <div class="flex items-center gap-2 md:hidden">
        <Button
          variant="outline"
          class="flex-1"
          onclick={() => (filterOpen = true)}
        >
          <SlidersHorizontal data-icon="inline-start" />
          筛选
          {activeFilters.length > 0 ? ` · ${activeFilters.length}` : ""}
        </Button>
        <Button class="flex-1" onclick={handleSearch}>
          <Search data-icon="inline-start" />
          查询
        </Button>
      </div>
      {#if activeFilters.length > 0}
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs text-muted-foreground">当前筛选：</span>
          {#each activeFilters as filter (filter.key)}
            <Button
              variant="secondary"
              size="xs"
              aria-label={`移除筛选：${filter.label}`}
              onclick={() => removeFilter(filter.key)}
            >
              {filter.label}：{filter.value}
              <X data-icon="inline-end" />
            </Button>
          {/each}
          <Button variant="ghost" size="xs" onclick={handleReset}>
            清除全部
          </Button>
        </div>
      {/if}
    </div>

    <Sheet bind:open={filterOpen}>
      <SheetContent
        side="bottom"
        class="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0"
      >
        <SheetHeader class="border-b p-4 pr-14">
          <SheetTitle>筛选条件</SheetTitle>
          <SheetDescription>
            按用户、状态、动作或时间范围筛选审计记录。
          </SheetDescription>
        </SheetHeader>
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          <AuditFilterFields bind:value={draft} prefix="audit-mobile" />
        </div>
        <SheetFooter class="flex-row gap-2 border-t p-4">
          <Button variant="outline" class="flex-1" onclick={resetAndClose}>
            重置
          </Button>
          <Button class="flex-1" onclick={searchAndClose}>应用筛选</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>

    <DataList
      items={logs}
      loading={listLoading}
      error={listError}
      columns={columnState.visibleColumns}
      density={densityState.density}
      skeletonColSpan={6}
      empty={{
        icon: activeFilters.length > 0 ? SearchX : ShieldAlert,
        title:
          activeFilters.length > 0 ? "没有符合条件的记录" : "还没有审计记录",
        description:
          activeFilters.length > 0
            ? "试着放宽筛选条件，或清除筛选后重试。"
            : "系统的写操作和权限拦截会自动记录在这里。",
      }}
      onRetry={() => list.refresh()}
      onHideColumn={columnState.toggle}
    >
      {#snippet emptyAction()}
        {#if activeFilters.length > 0}
          <Button variant="outline" onclick={handleReset}>清除筛选</Button>
        {/if}
      {/snippet}

      {#snippet card(log: AuditLog)}
        <RecordCard title={log.action} subtitle={formatDateTime(log.createdAt)}>
          {#snippet badges()}
            {@render statusBadge(log)}
          {/snippet}
          {#snippet meta()}
            <span>{log.username || "未知"}</span>
            <span>{log.ip || "-"}</span>
            {#if log.detail}
              <span class="w-full truncate">{log.detail}</span>
            {/if}
          {/snippet}
        </RecordCard>
      {/snippet}

      {#snippet cell(key: string, log: AuditLog)}
        {#if key === "createdAt"}
          {formatDateTime(log.createdAt)}
        {:else if key === "username"}
          {log.username || "未知"}
        {:else if key === "action"}
          {log.action}
        {:else if key === "ip"}
          {log.ip || "-"}
        {:else if key === "status"}
          {@render statusBadge(log)}
        {:else if key === "detail"}
          {log.detail || "-"}
        {/if}
      {/snippet}
    </DataList>
  </ListShell>
</div>
