<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { RouterLink } from "vue-router"
import {
  Activity,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getDashboardActivity, getDashboardStats } from "@/api/dashboard"
import { useAuthStore } from "@/stores/auth"
import { cn } from "@/lib/utils"
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

const auth = useAuthStore()
const stats = ref<DashboardStats | null>(null)
const activity = ref<ActivityItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  const [statsRes, activityRes] = await Promise.all([
    getDashboardStats(),
    getDashboardActivity(),
  ])
  if (statsRes.code === 0) stats.value = statsRes.data
  if (activityRes.code === 0) activity.value = activityRes.data
  if (statsRes.code !== 0 || activityRes.code !== 0) {
    error.value = statsRes.message || activityRes.message || "加载数据失败"
  }
  loading.value = false
}

onMounted(() => {
  void load()
})

const statItems = computed(() =>
  stats.value
    ? [
        {
          title: "总用户数",
          value: String(stats.value.totalUsers),
          icon: Users,
        },
        {
          title: "当前活跃",
          value: String(stats.value.activeNow),
          icon: Activity,
        },
        { title: "收入", value: stats.value.revenue, icon: DollarSign },
        { title: "增长率", value: stats.value.growth, icon: TrendingUp },
      ]
    : []
)

const quickLinks = computed(() =>
  QUICK_LINKS.filter((link) => auth.hasPermission(link.permission))
)
</script>

<template>
  <div class="flex flex-col gap-(--page-gap)">
    <PageHeader title="仪表盘" description="欢迎回来，以下是系统概览。">
      <template #actions>
        <Button variant="outline" :disabled="loading" @click="load">
          <RefreshCw data-icon="inline-start" />
          刷新
        </Button>
      </template>
    </PageHeader>

    <Alert>
      <Info />
      <AlertTitle>演示数据</AlertTitle>
      <AlertDescription>
        “当前活跃”“收入”“增长率”和“最近动态”由后端占位接口返回，接入真实业务统计后请替换。
      </AlertDescription>
    </Alert>

    <InlineError v-if="error && stats" :message="error" :on-retry="load" />

    <ErrorState v-if="error && !stats" :message="error" :on-retry="load" />

    <template v-else>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <template v-if="loading">
          <Card v-for="index in 4" :key="index">
            <CardHeader class="flex flex-row items-center justify-between">
              <Skeleton class="h-4 w-20" />
              <Skeleton class="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton class="h-8 w-24" />
            </CardContent>
          </Card>
        </template>
        <template v-else>
          <Card v-for="stat in statItems" :key="stat.title">
            <CardHeader class="flex flex-row items-center justify-between">
              <CardTitle class="text-sm font-medium">
                {{ stat.title }}
              </CardTitle>
              <component :is="stat.icon" class="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold tabular-nums">
                {{ stat.value }}
              </div>
            </CardContent>
          </Card>
        </template>
      </div>

      <div :class="cn('grid gap-4', quickLinks.length > 0 && 'md:grid-cols-2')">
        <Card>
          <CardHeader>
            <CardTitle>最近动态</CardTitle>
            <CardDescription>工作区中的最新操作记录。</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="loading" class="flex flex-col gap-4">
              <div
                v-for="index in 5"
                :key="index"
                class="flex items-center justify-between"
              >
                <div class="flex flex-col gap-1">
                  <Skeleton class="h-4 w-16" />
                  <Skeleton class="h-3 w-32" />
                </div>
                <Skeleton class="h-3 w-16" />
              </div>
            </div>
            <EmptyState
              v-else-if="activity.length === 0"
              :icon="Activity"
              title="暂无动态"
              description="系统产生操作记录后会显示在这里。"
            />
            <div v-else class="flex flex-col gap-4">
              <div
                v-for="(item, index) in activity"
                :key="`${item.user}-${index}`"
                class="flex items-center justify-between gap-3"
              >
                <div class="flex min-w-0 flex-col">
                  <span class="truncate text-sm font-medium">
                    {{ item.user }}
                  </span>
                  <span class="truncate text-xs text-muted-foreground">
                    {{ item.action }}
                  </span>
                </div>
                <span class="shrink-0 text-xs text-muted-foreground">
                  {{ item.time }}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card v-if="quickLinks.length > 0">
          <CardHeader>
            <CardTitle>快捷入口</CardTitle>
            <CardDescription>只显示您有权限访问的页面。</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="flex flex-col gap-2">
              <RouterLink
                v-for="link in quickLinks"
                :key="link.href"
                :to="link.href"
                class="flex items-center gap-3 rounded-xl border p-3 transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                <component
                  :is="link.icon"
                  class="size-4 shrink-0 text-muted-foreground"
                />
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
      </div>
    </template>
  </div>
</template>
