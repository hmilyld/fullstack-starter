<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
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
  {
    href: "/settings/user",
    label: "用户管理",
    description: "维护团队成员及其角色",
    icon: Users,
    permission: "users",
  },
  {
    href: "/settings/role",
    label: "角色管理",
    description: "分配角色与权限",
    icon: ShieldCheck,
    permission: "roles",
  },
  {
    href: "/settings/audit-log",
    label: "审计日志",
    description: "查看写操作与权限拦截",
    icon: FileText,
    permission: "audit_logs",
  },
  {
    href: "/settings/data",
    label: "数据管理",
    description: "导出或恢复系统数据",
    icon: Database,
    permission: "data_management.export",
  },
]

type TrendPoint = {
  label: string
  success: number
  failed: number
  total: number
}

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

const statsNumber = new Intl.NumberFormat("zh-CN")

const statItems = computed(() => {
  if (!stats.value) return []
  return [
    {
      title: "总用户数",
      value: statsNumber.format(stats.value.totalUsers),
      hint: "全部账号",
      icon: Users,
      demo: false,
    },
    {
      title: "当前活跃",
      value: statsNumber.format(stats.value.activeNow),
      hint: "最近活跃会话",
      icon: Activity,
      demo: true,
    },
    {
      title: "收入",
      value: stats.value.revenue,
      hint: "本月累计",
      icon: DollarSign,
      demo: true,
    },
    {
      title: "增长率",
      value: stats.value.growth,
      hint: "较上月",
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
    error.value = statsRes.message || activityRes.message || "加载数据失败"
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
      title="仪表盘"
      description="系统概览：账号规模、活跃度与最近操作。"
    >
      <template #actions>
        <Button variant="outline" :disabled="loading" @click="load">
          <RefreshCw data-icon="inline-start" />
          刷新
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
                  演示数据
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
              <CardTitle>近 7 天操作趋势</CardTitle>
              <CardDescription>
                {{
                  canReadAudit
                    ? `共 ${weekTotal} 次写操作，按天统计。`
                    : "按天统计审计日志中的写操作，用于判断系统活跃度。"
                }}
              </CardDescription>
            </div>
            <div
              v-if="canReadAudit && weekTotal > 0"
              class="flex shrink-0 items-center gap-3 pt-1 text-xs text-muted-foreground"
            >
              <span class="flex items-center gap-1.5">
                <span class="size-2 rounded-full bg-chart-1" />
                成功 {{ weekSuccess }}
              </span>
              <span v-if="weekFailed > 0" class="flex items-center gap-1.5">
                <span class="size-2 rounded-full bg-destructive" />
                失败 {{ weekFailed }}
              </span>
            </div>
          </CardHeader>
          <CardContent class="h-[280px]">
            <div
              v-if="!canReadAudit"
              class="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 text-center"
            >
              <ShieldCheck class="size-5 text-muted-foreground" />
              <p class="text-sm font-medium">趋势需要审计权限</p>
              <p class="max-w-xs text-xs text-muted-foreground">
                当前账号没有「审计日志」权限，无法读取操作记录。联系管理员为该角色授予权限后即可查看。
              </p>
            </div>
            <Skeleton v-else-if="trendLoading" class="h-full w-full" />
            <div
              v-else-if="weekTotal === 0"
              class="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 text-center"
            >
              <Activity class="size-5 text-muted-foreground" />
              <p class="text-sm font-medium">最近 7 天没有写操作</p>
              <p class="max-w-xs text-xs text-muted-foreground">
                用户新增、修改、删除等操作会出现在这里。
              </p>
            </div>
            <TrendChart v-else :points="trend" />
          </CardContent>
        </Card>

        <Card class="lg:col-span-3">
          <CardHeader>
            <CardTitle>最近动态</CardTitle>
            <CardDescription>工作区中的最新操作记录。</CardDescription>
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
              title="暂无动态"
              description="系统产生操作记录后会显示在这里。"
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
              查看全部审计日志
              <ArrowRight class="size-4" />
            </RouterLink>
          </CardFooter>
        </Card>
      </div>

      <Card v-if="quickLinks.length > 0">
        <CardHeader>
          <CardTitle>快捷入口</CardTitle>
          <CardDescription>只显示您有权限访问的页面。</CardDescription>
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
                <div class="text-sm font-medium">{{ link.label }}</div>
                <div class="truncate text-xs text-muted-foreground">
                  {{ link.description }}
                </div>
              </div>
              <ChevronRight class="size-4 shrink-0 text-muted-foreground" />
            </RouterLink>
          </div>
        </CardContent>
      </Card>

      <p class="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info class="size-3.5 shrink-0" />
        “当前活跃”“收入”“增长率”与“最近动态”来自后端的占位接口，接入真实统计后请替换。
      </p>
    </template>
  </div>
</template>
