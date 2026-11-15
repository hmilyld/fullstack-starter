<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink } from "vue-router"
import {
  Activity,
  ArrowRight,
  ChevronRight,
  Database,
  DollarSign,
  FileText,
  Info,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
} from "@lucide/vue"
import EmptyState from "@/components/shared/EmptyState.vue"
import ErrorState from "@/components/shared/ErrorState.vue"
import InlineError from "@/components/shared/InlineError.vue"
import PageHeader from "@/components/shared/PageHeader.vue"
import TrendChart from "@/components/shared/TrendChart.vue"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getAuditLogs } from "@/api/audit-log"
import { getDashboardActivity, getDashboardStats } from "@/api/dashboard"
import { useAuthStore } from "@/stores/auth"
import { cn } from "@/lib/utils"
import type { AuditLog } from "@/types/audit-log"
import type { ActivityItem, DashboardStats } from "@/types/dashboard"

const QUICK_LINKS = [
  { href: "/settings/user", key: "users", icon: Users, permission: "users" },
  {
    href: "/settings/role",
    key: "roles",
    icon: ShieldCheck,
    permission: "roles",
  },
  {
    href: "/settings/audit-log",
    key: "audit",
    icon: FileText,
    permission: "audit_logs",
  },
  {
    href: "/settings/data",
    key: "data",
    icon: Database,
    permission: "data_management.export",
  },
] as const

type TrendPoint = {
  label: string
  success: number
  failed: number
  total: number
}

const { t, locale } = useI18n()
const auth = useAuthStore()
const stats = ref<DashboardStats | null>(null)
const activity = ref<ActivityItem[]>([])
const logs = ref<AuditLog[]>([])
const loading = ref(true)
const trendLoading = ref(true)
const error = ref<string | null>(null)

const canReadAudit = computed(() => auth.hasPermission("audit_logs"))

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function toLocalInput(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function buildTrend(records: AuditLog[]): TrendPoint[] {
  const today = startOfDay(new Date())
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today)
    day.setDate(today.getDate() - (6 - index))
    return day
  })

  const points = days.map((day) => ({
    label: `${day.getMonth() + 1}/${day.getDate()}`,
    success: 0,
    failed: 0,
    total: 0,
  }))

  for (const log of records) {
    const created = new Date(log.createdAt)
    if (Number.isNaN(created.getTime())) continue
    const index = days.findIndex(
      (day) => day.getTime() === startOfDay(created).getTime()
    )
    if (index < 0) continue
    points[index].total += 1
    if (log.status === "success") points[index].success += 1
    else points[index].failed += 1
  }

  return points
}

const trend = computed(() => buildTrend(logs.value))
const weekTotal = computed(() =>
  trend.value.reduce((sum, point) => sum + point.total, 0)
)
const weekSuccess = computed(() =>
  trend.value.reduce((sum, point) => sum + point.success, 0)
)
const weekFailed = computed(() =>
  trend.value.reduce((sum, point) => sum + point.failed, 0)
)

const statsNumber = computed(() => new Intl.NumberFormat(locale.value))

const statItems = computed(() => {
  if (!stats.value) return []
  const numberFormat = statsNumber.value
  return [
    {
      title: t("dashboard.stats.totalUsers"),
      value: numberFormat.format(stats.value.totalUsers),
      hint: t("dashboard.stats.allAccounts"),
      icon: Users,
      demo: false,
    },
    {
      title: t("dashboard.stats.activeNow"),
      value: numberFormat.format(stats.value.activeNow),
      hint: t("dashboard.stats.recentSessions"),
      icon: Activity,
      demo: true,
    },
    {
      title: t("dashboard.stats.revenue"),
      value: stats.value.revenue,
      hint: t("dashboard.stats.monthTotal"),
      icon: DollarSign,
      demo: true,
    },
    {
      title: t("dashboard.stats.growth"),
      value: stats.value.growth,
      hint: t("dashboard.stats.vsLastMonth"),
      icon: TrendingUp,
      demo: true,
    },
  ]
})

const quickLinks = computed(() =>
  QUICK_LINKS.filter((link) => auth.hasPermission(link.permission))
)

async function load() {
  loading.value = true
  error.value = null

  const firstDay = startOfDay(new Date())
  firstDay.setDate(firstDay.getDate() - 6)

  const [statsRes, activityRes, auditRes] = await Promise.all([
    getDashboardStats(),
    getDashboardActivity(),
    canReadAudit.value
      ? getAuditLogs({ startTime: toLocalInput(firstDay), pageSize: 500 })
      : Promise.resolve(null),
  ])

  if (statsRes.code === 0) stats.value = statsRes.data
  if (activityRes.code === 0) activity.value = activityRes.data
  if (auditRes && auditRes.code === 0) logs.value = auditRes.data.list
  if (statsRes.code !== 0 || activityRes.code !== 0) {
    error.value =
      statsRes.message || activityRes.message || t("dashboard.loadFailed")
  }
  loading.value = false
  trendLoading.value = false
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="flex flex-col gap-(--page-gap)">
    <PageHeader
      :title="t('dashboard.title')"
      :description="t('dashboard.description')"
    >
      <template #actions>
        <Button variant="outline" :disabled="loading" @click="load">
          <RefreshCw data-icon="inline-start" />
          {{ t("dashboard.refresh") }}
        </Button>
      </template>
    </PageHeader>

    <InlineError v-if="error && stats" :message="error" @retry="load" />

    <ErrorState v-if="error && !stats" :message="error" @retry="load" />

    <template v-else>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <template v-if="loading">
          <Card v-for="index in 4" :key="index" class="gap-2">
            <CardHeader class="flex flex-row items-center justify-between">
              <Skeleton class="h-4 w-20" />
              <Skeleton class="size-8 rounded-lg" />
            </CardHeader>
            <CardContent class="flex flex-col gap-2">
              <Skeleton class="h-8 w-24" />
              <Skeleton class="h-3 w-16" />
            </CardContent>
          </Card>
        </template>
        <template v-else>
          <Card v-for="stat in statItems" :key="stat.title" class="gap-2">
            <CardHeader
              class="flex flex-row items-center justify-between gap-2 pb-0"
            >
              <CardTitle class="text-sm font-medium text-muted-foreground">
                {{ stat.title }}
              </CardTitle>
              <component
                :is="stat.icon"
                class="size-4 shrink-0 text-muted-foreground"
              />
            </CardHeader>
            <CardContent>
              <div
                class="font-heading text-3xl font-semibold tracking-tight tabular-nums"
              >
                {{ stat.value }}
              </div>
              <div
                class="mt-1 flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span>{{ stat.hint }}</span>
                <Badge
                  v-if="stat.demo"
                  variant="outline"
                  class="h-4 px-1.5 text-[10px] font-normal"
                >
                  {{ t("dashboard.demoData") }}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </template>
      </div>

      <div class="grid gap-4 lg:grid-cols-7">
        <Card class="lg:col-span-4">
          <CardHeader class="flex flex-row items-start justify-between gap-4">
            <div class="grid gap-1.5">
              <CardTitle>{{ t("dashboard.trendTitle") }}</CardTitle>
              <CardDescription>
                {{
                  canReadAudit
                    ? t("dashboard.trendDescription", { count: weekTotal })
                    : t("dashboard.trendDescriptionNoAudit")
                }}
              </CardDescription>
            </div>
            <div
              v-if="canReadAudit && weekTotal > 0"
              class="flex shrink-0 items-center gap-3 pt-1 text-xs text-muted-foreground"
            >
              <span class="flex items-center gap-1.5">
                <span class="size-2 rounded-full bg-chart-1" />
                {{ t("dashboard.trendSuccess", { count: weekSuccess }) }}
              </span>
              <span v-if="weekFailed > 0" class="flex items-center gap-1.5">
                <span class="size-2 rounded-full bg-destructive" />
                {{ t("dashboard.trendFailed", { count: weekFailed }) }}
              </span>
            </div>
          </CardHeader>
          <CardContent class="h-[280px]">
            <div
              v-if="!canReadAudit"
              class="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 text-center"
            >
              <ShieldCheck class="size-5 text-muted-foreground" />
              <p class="text-sm font-medium">
                {{ t("dashboard.noAuditTitle") }}
              </p>
              <p class="max-w-xs text-xs text-muted-foreground">
                {{ t("dashboard.noAuditDescription") }}
              </p>
            </div>
            <Skeleton v-else-if="trendLoading" class="h-full w-full" />
            <div
              v-else-if="weekTotal === 0"
              class="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 text-center"
            >
              <Activity class="size-5 text-muted-foreground" />
              <p class="text-sm font-medium">
                {{ t("dashboard.emptyTrendTitle") }}
              </p>
              <p class="max-w-xs text-xs text-muted-foreground">
                {{ t("dashboard.emptyTrendDescription") }}
              </p>
            </div>
            <TrendChart v-else :points="trend" />
          </CardContent>
        </Card>

        <Card class="lg:col-span-3">
          <CardHeader>
            <CardTitle>{{ t("dashboard.recentTitle") }}</CardTitle>
            <CardDescription>{{
              t("dashboard.recentDescription")
            }}</CardDescription>
          </CardHeader>
          <CardContent class="flex-1">
            <div v-if="loading" class="flex flex-col gap-4">
              <div
                v-for="index in 5"
                :key="index"
                class="flex items-center justify-between gap-3"
              >
                <div class="flex items-center gap-3">
                  <Skeleton class="size-8 rounded-full" />
                  <div class="flex flex-col gap-1">
                    <Skeleton class="h-3.5 w-16" />
                    <Skeleton class="h-3 w-32" />
                  </div>
                </div>
                <Skeleton class="h-3 w-16" />
              </div>
            </div>
            <EmptyState
              v-else-if="activity.length === 0"
              :icon="Activity"
              :title="t('dashboard.emptyRecentTitle')"
              :description="t('dashboard.emptyRecentDescription')"
              class="border-0 py-8"
            />
            <div v-else class="flex flex-col gap-4">
              <div
                v-for="(item, index) in activity"
                :key="`${item.user}-${index}`"
                class="flex items-center gap-3"
              >
                <Avatar class="size-8">
                  <AvatarFallback class="text-xs">
                    {{ item.user.slice(0, 1) }}
                  </AvatarFallback>
                </Avatar>
                <div class="flex min-w-0 flex-1 flex-col">
                  <span class="truncate text-sm font-medium">
                    {{ item.user }}
                  </span>
                  <span class="truncate text-xs text-muted-foreground">
                    {{ item.action }}
                  </span>
                </div>
                <span
                  class="shrink-0 text-xs text-muted-foreground tabular-nums"
                >
                  {{ item.time }}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter class="mt-auto border-t pt-4">
            <RouterLink
              to="/settings/audit-log"
              class="flex w-full items-center justify-between gap-2 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              {{ t("dashboard.viewAll") }}
              <ArrowRight class="size-4" />
            </RouterLink>
          </CardFooter>
        </Card>
      </div>

      <Card v-if="quickLinks.length > 0">
        <CardHeader>
          <CardTitle>{{ t("dashboard.quickTitle") }}</CardTitle>
          <CardDescription>{{
            t("dashboard.quickDescription")
          }}</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid gap-2 sm:grid-cols-2">
            <RouterLink
              v-for="link in quickLinks"
              :key="link.href"
              :to="link.href"
              :class="
                cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-colors outline-none',
                  'hover:border-ring/40 hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring'
                )
              "
            >
              <span
                class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
              >
                <component :is="link.icon" class="size-4" />
              </span>
              <div class="min-w-0 flex-1">
                <div class="text-sm font-medium">
                  {{ t(`dashboard.links.${link.key}.label`) }}
                </div>
                <div class="truncate text-xs text-muted-foreground">
                  {{ t(`dashboard.links.${link.key}.description`) }}
                </div>
              </div>
              <ChevronRight class="size-4 shrink-0 text-muted-foreground" />
            </RouterLink>
          </div>
        </CardContent>
      </Card>

      <p class="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info class="size-3.5 shrink-0" />
        {{ t("dashboard.placeholderNote") }}
      </p>
    </template>
  </div>
</template>
