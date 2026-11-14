<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import {
  RotateCcw,
  Search,
  SearchX,
  ShieldAlert,
  SlidersHorizontal,
  X,
} from "@lucide/vue"
import ColumnToggle from "@/components/shared/ColumnToggle.vue"
import DensityToggle from "@/components/shared/DensityToggle.vue"
import DataList, { type DataColumn } from "@/components/shared/DataList.vue"
import ListShell from "@/components/shared/ListShell.vue"
import PageHeader from "@/components/shared/PageHeader.vue"
import RecordCard from "@/components/shared/RecordCard.vue"
import TablePagination from "@/components/shared/TablePagination.vue"
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
import { getAuditLogs } from "@/api/audit-log"
import { useColumnVisibility } from "@/composables/use-column-visibility"
import { useTableDensity } from "@/composables/use-table-density"
import { usePagedList } from "@/composables/use-paged-list"
import { useUrlPage } from "@/composables/use-url-list-state"
import { formatDateTimeInput, type DateTimeLocale } from "@/lib/date-time"
import { formatDateTime } from "@/lib/format"
import type { AuditFilterKey, AuditFilters, AuditLog } from "@/types/audit-log"
import { translateOr } from "@/lib/label"

const DEFAULT_PAGE_SIZE = 10
const PAGE_SIZE_OPTIONS = [10, 20, 50]

const EMPTY_FILTERS: AuditFilters = {
  userId: "",
  status: "",
  action: "",
  startTime: "",
  endTime: "",
}

const { t, locale } = useI18n()
const dateLocale = computed<DateTimeLocale>(() =>
  String(locale.value).startsWith("en") ? "en" : "zh-CN"
)
const filterLabel = (key: AuditFilterKey) => t(`auditLogPage.filters.${key}`)

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

const pageSize = ref(DEFAULT_PAGE_SIZE)

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
  pageSize,
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

function statusLabel(status: string) {
  return translateOr(`auditLogPage.status.${status}`, status)
}

function formatFilterValue(key: AuditFilterKey, value: string) {
  if (key === "status") return statusLabel(value)
  if (key === "startTime" || key === "endTime")
    return formatDateTimeInput(value, dateLocale.value)
  return value
}

const activeFilters = computed(() =>
  (Object.keys(query.value) as AuditFilterKey[])
    .filter((key) => query.value[key] !== "")
    .map((key) => ({
      key,
      label: filterLabel(key),
      value: formatFilterValue(key, query.value[key]),
    }))
)

function statusVariant(status: AuditLog["status"]) {
  if (status === "success") return "success"
  if (status === "fail") return "destructive"
  return "warning"
}

const columns = computed<DataColumn[]>(() => [
  {
    key: "createdAt",
    header: t("auditLogPage.columns.time"),
    cellClass: "whitespace-nowrap text-muted-foreground",
  },
  {
    key: "username",
    header: t("auditLogPage.columns.username"),
    hideable: true,
    headClass: "hidden md:table-cell",
    cellClass: "hidden md:table-cell",
  },
  {
    key: "action",
    header: t("auditLogPage.columns.action"),
    cellClass: "font-mono text-xs",
  },
  {
    key: "ip",
    header: t("auditLogPage.columns.ip"),
    hideable: true,
    headClass: "hidden lg:table-cell",
    cellClass: "hidden text-muted-foreground lg:table-cell",
  },
  { key: "status", header: t("auditLogPage.columns.status") },
  {
    key: "detail",
    header: t("auditLogPage.columns.detail"),
    hideable: true,
    headClass: "hidden xl:table-cell",
    cellClass:
      "hidden max-w-[240px] truncate text-muted-foreground xl:table-cell",
  },
])

const { hidden, visibleColumns, toggle, reset } = useColumnVisibility(
  "audit-logs",
  columns
)
const { density, setDensity } = useTableDensity("audit-logs")

const hasLogs = computed(() => logs.value.length > 0)
</script>

<template>
  <div class="flex flex-col gap-(--page-gap)">
    <PageHeader
      :title="t('auditLogPage.title')"
      :description="t('auditLogPage.description')"
    />

    <ListShell :description="t('auditLogPage.listDescription', { total })">
      <template v-if="hasLogs" #footer>
        <TablePagination
          :page="currentPage"
          :total-pages="totalPages"
          :total="total"
          :item-label="t('auditLogPage.entityName')"
          :page-size="pageSize"
          :page-size-options="PAGE_SIZE_OPTIONS"
          @page-change="setListPage"
          @page-size-change="
            (size) => {
              pageSize = size
              setListPage(1)
            }
          "
        />
      </template>

      <div class="flex flex-col gap-3 pb-4">
        <div class="hidden flex-col gap-3 md:flex">
          <AuditFilterFields v-model="draft" prefix="audit" />
          <div class="flex items-center gap-2">
            <Button @click="handleSearch">
              <Search data-icon="inline-start" />
              {{ t("auditLogPage.search") }}
            </Button>
            <Button variant="outline" @click="handleReset">
              <RotateCcw data-icon="inline-start" />
              {{ t("auditLogPage.reset") }}
            </Button>
            <ColumnToggle
              :columns="columns"
              :hidden="hidden"
              @toggle="toggle"
              @reset="reset"
            />
            <DensityToggle :density="density" @change="setDensity" />
          </div>
        </div>
        <div class="flex items-center gap-2 md:hidden">
          <Button variant="outline" class="flex-1" @click="filterOpen = true">
            <SlidersHorizontal data-icon="inline-start" />
            {{ t("auditLogPage.filterButton") }}
            {{ activeFilters.length > 0 ? ` · ${activeFilters.length}` : "" }}
          </Button>
          <Button class="flex-1" @click="handleSearch">
            <Search data-icon="inline-start" />
            {{ t("auditLogPage.search") }}
          </Button>
        </div>
        <div
          v-if="activeFilters.length > 0"
          class="flex flex-wrap items-center gap-2"
        >
          <span class="text-xs text-muted-foreground">{{
            t("auditLogPage.currentFilters")
          }}</span>
          <Button
            v-for="filter in activeFilters"
            :key="filter.key"
            variant="secondary"
            size="xs"
            :aria-label="
              t('auditLogPage.removeFilterAria', { label: filter.label })
            "
            @click="removeFilter(filter.key)"
          >
            {{ filter.label }}{{ t("auditLogPage.filterSeparator")
            }}{{ filter.value }}
            <X data-icon="inline-end" />
          </Button>
          <Button variant="ghost" size="xs" @click="handleReset">
            {{ t("auditLogPage.clearAll") }}
          </Button>
        </div>
      </div>

      <Sheet :open="filterOpen" @update:open="filterOpen = $event">
        <SheetContent
          side="bottom"
          class="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0"
        >
          <SheetHeader class="border-b p-4 pr-14">
            <SheetTitle>{{ t("auditLogPage.sheetTitle") }}</SheetTitle>
            <SheetDescription>
              {{ t("auditLogPage.sheetDescription") }}
            </SheetDescription>
          </SheetHeader>
          <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
            <AuditFilterFields v-model="draft" prefix="audit-mobile" />
          </div>
          <SheetFooter class="flex-row gap-2 border-t p-4">
            <Button variant="outline" class="flex-1" @click="resetAndClose">
              {{ t("auditLogPage.reset") }}
            </Button>
            <Button class="flex-1" @click="searchAndClose">{{
              t("auditLogPage.apply")
            }}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <DataList
        :items="logs"
        :loading="listLoading"
        :error="listError"
        :columns="visibleColumns"
        :density="density"
        :skeleton-col-span="6"
        :empty="{
          icon: activeFilters.length > 0 ? SearchX : ShieldAlert,
          title:
            activeFilters.length > 0
              ? t('auditLogPage.emptySearchTitle')
              : t('auditLogPage.emptyTitle'),
          description:
            activeFilters.length > 0
              ? t('auditLogPage.emptySearchDescription')
              : t('auditLogPage.emptyDescription'),
        }"
        @retry="refreshList"
        @hide-column="toggle"
      >
        <template #empty-action>
          <Button
            v-if="activeFilters.length > 0"
            variant="outline"
            @click="handleReset"
          >
            {{ t("auditLogPage.clearFilter") }}
          </Button>
        </template>

        <template #card="{ row }">
          <RecordCard
            :title="row.action"
            :subtitle="formatDateTime(row.createdAt, dateLocale)"
          >
            <template #badges>
              <Badge :variant="statusVariant(row.status)">
                {{ statusLabel(row.status) }}
              </Badge>
            </template>
            <template #meta>
              <span>{{ row.username || t("auditLogPage.unknown") }}</span>
              <span>{{ row.ip || "-" }}</span>
              <span v-if="row.detail" class="w-full truncate">
                {{ row.detail }}
              </span>
            </template>
          </RecordCard>
        </template>

        <template #cell-createdAt="{ row }">
          {{ formatDateTime(row.createdAt, dateLocale) }}
        </template>
        <template #cell-username="{ row }">
          {{ row.username || t("auditLogPage.unknown") }}
        </template>
        <template #cell-action="{ row }">{{ row.action }}</template>
        <template #cell-ip="{ row }">{{ row.ip || "-" }}</template>
        <template #cell-status="{ row }">
          <Badge :variant="statusVariant(row.status)">
            {{ statusLabel(row.status) }}
          </Badge>
        </template>
        <template #cell-detail="{ row }">{{ row.detail || "-" }}</template>
      </DataList>
    </ListShell>
  </div>
</template>
