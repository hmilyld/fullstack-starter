<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import {
  RotateCcw,
  Search,
  SearchX,
  ShieldAlert,
  SlidersHorizontal,
  X,
} from "@lucide/vue"
import EmptyState from "@/components/shared/EmptyState.vue"
import ErrorState from "@/components/shared/ErrorState.vue"
import InlineError from "@/components/shared/InlineError.vue"
import ListShell from "@/components/shared/ListShell.vue"
import PageHeader from "@/components/shared/PageHeader.vue"
import RecordCard from "@/components/shared/RecordCard.vue"
import TablePagination from "@/components/shared/TablePagination.vue"
import TableSkeletonRow from "@/components/shared/TableSkeletonRow.vue"
import AuditFilterFields from "@/pages/settings/AuditLog/AuditFilterFields.vue"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getAuditLogs } from "@/api/audit-log"
import { usePagedList } from "@/composables/use-paged-list"
import { useUrlPage } from "@/composables/use-url-list-state"
import { formatDateTime } from "@/lib/format"
import type { AuditFilterKey, AuditFilters, AuditLog } from "@/types/audit-log"

const PAGE_SIZE = 10

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

function readQuery(value: unknown): string {
  return typeof value === "string" ? value : ""
}

const route = useRoute()
const router = useRouter()

const query = computed<AuditFilters>(() => ({
  userId: readQuery(route.query.userId),
  status: readQuery(route.query.status),
  action: readQuery(route.query.action),
  startTime: readQuery(route.query.startTime),
  endTime: readQuery(route.query.endTime),
}))

const { page, setPage } = useUrlPage()
const draft = ref<AuditFilters>({ ...query.value })
const filterOpen = ref(false)

const {
  items: logs,
  total,
  page: currentPage,
  totalPages,
  loading: listLoading,
  error: listError,
  setPage: setListPage,
  refresh: refreshList,
} = usePagedList<AuditLog, AuditFilters>({
  fetcher: getAuditLogs,
  params: query,
  pageSize: PAGE_SIZE,
  page,
  onPageChange: setPage,
})

// 浏览器前进/后退或外部链接改变筛选条件时，同步表单草稿
watch(query, (value) => {
  draft.value = { ...value }
})

const FILTER_KEYS: AuditFilterKey[] = [
  "userId",
  "status",
  "action",
  "startTime",
  "endTime",
]

function writeFilters(filters: AuditFilters) {
  const next = { ...route.query }
  for (const key of FILTER_KEYS) {
    if (filters[key]) next[key] = filters[key]
    else delete next[key]
  }
  delete next.page
  void router.replace({ query: next })
}

function handleSearch() {
  writeFilters({
    userId: draft.value.userId.trim(),
    status: draft.value.status,
    action: draft.value.action.trim(),
    startTime: draft.value.startTime,
    endTime: draft.value.endTime,
  })
}

function handleReset() {
  draft.value = { ...EMPTY_FILTERS }
  writeFilters(EMPTY_FILTERS)
}

function searchAndClose() {
  handleSearch()
  filterOpen.value = false
}

function resetAndClose() {
  handleReset()
  filterOpen.value = false
}

function removeFilter(key: AuditFilterKey) {
  draft.value = { ...draft.value, [key]: "" }
  const next = { ...route.query }
  delete next[key]
  delete next.page
  void router.replace({ query: next })
}

function formatFilterValue(key: AuditFilterKey, value: string) {
  if (key === "status") return STATUS_LABELS[value] ?? value
  if (key === "startTime" || key === "endTime") return formatDateTime(value)
  return value
}

const activeFilters = computed(() =>
  (Object.keys(query.value) as AuditFilterKey[])
    .filter((key) => query.value[key] !== "")
    .map((key) => ({
      key,
      label: FILTER_LABELS[key],
      value: formatFilterValue(key, query.value[key]),
    }))
)

function statusVariant(status: AuditLog["status"]) {
  if (status === "success") return "success"
  if (status === "fail") return "destructive"
  return "warning"
}

function statusLabel(status: AuditLog["status"]) {
  return STATUS_LABELS[status] ?? status
}

const hasLogs = computed(() => logs.value.length > 0)
const showEmpty = computed(() => !listLoading.value && !hasLogs.value)
</script>

<template>
  <div class="flex flex-col gap-(--page-gap)">
    <PageHeader
      title="审计日志"
      description="查看系统的写操作与权限拦截记录。"
    />

    <ListShell title="操作记录" :description="`共 ${total} 条记录`">
      <template v-if="hasLogs" #footer>
        <TablePagination
          :page="currentPage"
          :total-pages="totalPages"
          :total="total"
          item-label="条记录"
          @page-change="setListPage"
        />
      </template>

      <div class="flex flex-col gap-3 pb-4">
        <div class="hidden flex-col gap-3 md:flex">
          <AuditFilterFields v-model="draft" prefix="audit" />
          <div class="flex items-center gap-2">
            <Button @click="handleSearch">
              <Search data-icon="inline-start" />
              查询
            </Button>
            <Button variant="outline" @click="handleReset">
              <RotateCcw data-icon="inline-start" />
              重置
            </Button>
          </div>
        </div>
        <div class="flex items-center gap-2 md:hidden">
          <Button variant="outline" class="flex-1" @click="filterOpen = true">
            <SlidersHorizontal data-icon="inline-start" />
            筛选
            {{ activeFilters.length > 0 ? ` · ${activeFilters.length}` : "" }}
          </Button>
          <Button class="flex-1" @click="handleSearch">
            <Search data-icon="inline-start" />
            查询
          </Button>
        </div>
        <div
          v-if="activeFilters.length > 0"
          class="flex flex-wrap items-center gap-2"
        >
          <span class="text-xs text-muted-foreground">当前筛选：</span>
          <Button
            v-for="filter in activeFilters"
            :key="filter.key"
            variant="secondary"
            size="xs"
            :aria-label="`移除筛选：${filter.label}`"
            @click="removeFilter(filter.key)"
          >
            {{ filter.label }}：{{ filter.value }}
            <X data-icon="inline-end" />
          </Button>
          <Button variant="ghost" size="xs" @click="handleReset">
            清除全部
          </Button>
        </div>
      </div>

      <Sheet :open="filterOpen" @update:open="filterOpen = $event">
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
            <AuditFilterFields v-model="draft" prefix="audit-mobile" />
          </div>
          <SheetFooter class="flex-row gap-2 border-t p-4">
            <Button variant="outline" class="flex-1" @click="resetAndClose">
              重置
            </Button>
            <Button class="flex-1" @click="searchAndClose">应用筛选</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <InlineError
        v-if="listError && hasLogs"
        :message="listError"
        :on-retry="refreshList"
      />

      <TableSkeletonRow v-if="listLoading && !hasLogs" :col-span="6" />
      <ErrorState
        v-else-if="listError && !hasLogs"
        :message="listError"
        :on-retry="refreshList"
      />
      <EmptyState
        v-else-if="showEmpty"
        :icon="activeFilters.length > 0 ? SearchX : ShieldAlert"
        :title="
          activeFilters.length > 0 ? '没有符合条件的记录' : '还没有审计记录'
        "
        :description="
          activeFilters.length > 0
            ? '试着放宽筛选条件，或清除筛选后重试。'
            : '系统的写操作和权限拦截会自动记录在这里。'
        "
      >
        <template v-if="activeFilters.length > 0" #action>
          <Button
            v-if="activeFilters.length > 0"
            variant="outline"
            @click="handleReset"
          >
            清除筛选
          </Button>
        </template>
      </EmptyState>

      <template v-else>
        <div class="flex flex-col gap-2 md:hidden">
          <RecordCard
            v-for="log in logs"
            :key="log.id"
            :title="log.action"
            :subtitle="formatDateTime(log.createdAt)"
          >
            <template #badges>
              <Badge :variant="statusVariant(log.status)">
                {{ statusLabel(log.status) }}
              </Badge>
            </template>
            <template #meta>
              <span>{{ log.username || "未知" }}</span>
              <span>{{ log.ip || "-" }}</span>
              <span v-if="log.detail" class="w-full truncate">
                {{ log.detail }}
              </span>
            </template>
          </RecordCard>
        </div>

        <div class="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead class="hidden md:table-cell">操作者</TableHead>
                <TableHead>动作</TableHead>
                <TableHead class="hidden lg:table-cell">IP</TableHead>
                <TableHead>状态</TableHead>
                <TableHead class="hidden xl:table-cell">详情</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="log in logs" :key="log.id">
                <TableCell class="whitespace-nowrap text-muted-foreground">
                  {{ formatDateTime(log.createdAt) }}
                </TableCell>
                <TableCell class="hidden md:table-cell">
                  {{ log.username || "未知" }}
                </TableCell>
                <TableCell class="font-mono text-xs">{{
                  log.action
                }}</TableCell>
                <TableCell class="hidden text-muted-foreground lg:table-cell">
                  {{ log.ip || "-" }}
                </TableCell>
                <TableCell>
                  <Badge :variant="statusVariant(log.status)">
                    {{ statusLabel(log.status) }}
                  </Badge>
                </TableCell>
                <TableCell
                  class="hidden max-w-[240px] truncate text-muted-foreground xl:table-cell"
                >
                  {{ log.detail || "-" }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </template>
    </ListShell>
  </div>
</template>
