<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getDashboardStats, getDashboardActivity } from '@/lib/api'
import type { DashboardStats, ActivityItem } from '@/types/api'
import {
  Users,
  Activity,
  DollarSign,
  TrendingUp,
} from 'lucide-vue-next'

const stats = ref<DashboardStats | null>(null)
const activity = ref<ActivityItem[]>([])
const loading = ref(true)

onMounted(async () => {
  const [statsRes, activityRes] = await Promise.all([
    getDashboardStats(),
    getDashboardActivity(),
  ])
  if (statsRes.code === 0) stats.value = statsRes.data
  if (activityRes.code === 0) activity.value = activityRes.data
  loading.value = false
})

const statItems = [
  { title: '总用户数', key: 'totalUsers' as const, icon: Users, change: '+20.1%', description: '较上月' },
  { title: '当前活跃', key: 'activeNow' as const, icon: Activity, change: '+12.2%', description: '较上小时' },
  { title: '收入', key: 'revenue' as const, icon: DollarSign, change: '+15.3%', description: '较上月' },
  { title: '增长率', key: 'growth' as const, icon: TrendingUp, change: '+4.5%', description: '较上季度' },
]
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-xl font-semibold">仪表盘</h1>
      <p class="text-sm text-base-content/50">欢迎回来，以下是您的项目概览。</p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <template v-if="loading">
        <div v-for="i in 4" :key="i" class="card border border-base-content/10 rounded-xl bg-transparent">
          <div class="card-body">
            <div class="skeleton h-3 w-16"></div>
            <div class="skeleton mb-1 h-6 w-20"></div>
            <div class="skeleton h-3 w-24"></div>
          </div>
        </div>
      </template>
      <template v-else>
        <div v-for="stat in statItems" :key="stat.title" class="card border border-base-content/10 rounded-xl bg-transparent">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <span class="text-xs text-base-content/50">{{ stat.title }}</span>
              <component :is="stat.icon" class="size-4 text-base-content/30" />
            </div>
            <div class="text-xl font-semibold">{{ stats?.[stat.key] }}</div>
            <p class="text-xs text-base-content/40">
              <span class="text-success">{{ stat.change }}</span>
              {{ stat.description }}
            </p>
          </div>
        </div>
      </template>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div class="card border border-base-content/10 rounded-xl bg-transparent">
        <div class="card-body">
          <h3 class="text-sm font-medium">最近动态</h3>
          <div class="flex flex-col gap-3">
            <template v-if="loading">
              <div v-for="i in 5" :key="i" class="flex items-center justify-between">
                <div class="flex flex-col gap-1">
                  <div class="skeleton h-3 w-16"></div>
                  <div class="skeleton h-3 w-28"></div>
                </div>
                <div class="skeleton h-3 w-12"></div>
              </div>
            </template>
            <template v-else>
              <div v-for="item in activity" :key="item.user" class="flex items-center justify-between">
                <div class="flex flex-col">
                  <span class="text-sm">{{ item.user }}</span>
                  <span class="text-xs text-base-content/40">{{ item.action }}</span>
                </div>
                <span class="text-xs text-base-content/40">{{ item.time }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div class="card border border-base-content/10 rounded-xl bg-transparent">
        <div class="card-body">
          <h3 class="text-sm font-medium">快捷操作</h3>
          <div class="flex flex-col gap-2">
            <div
              v-for="action in [
                { label: '创建项目', desc: '开始一个新的工作空间' },
                { label: '邀请团队', desc: '添加协作者' },
                { label: '查看报表', desc: '数据分析与洞察' },
                { label: '管理账单', desc: '更新支付方式' },
              ]"
              :key="action.label"
              class="flex cursor-pointer items-center justify-between rounded-xl border border-base-content/10 p-3 transition-colors hover:border-base-content/20"
            >
              <div>
                <div class="text-sm">{{ action.label }}</div>
                <div class="text-xs text-base-content/40">{{ action.desc }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
