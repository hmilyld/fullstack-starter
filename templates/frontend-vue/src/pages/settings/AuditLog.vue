<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { getAuditLogs } from '@/lib/api'
import type { AuditLog } from '@/types/api'
import { useToast } from '@/composables/use-toast'
import Pagination from '@/components/shared/Pagination.vue'
import PageSkeleton from '@/components/shared/PageSkeleton.vue'
import { Search, RotateCcw, X } from 'lucide-vue-next'

const toast = useToast()

const PAGE_SIZE = 10

type FilterKey = 'userId' | 'status' | 'action' | 'startTime' | 'endTime'

const FILTER_LABELS: Record<FilterKey, string> = {
  userId: '用户ID',
  status: '状态',
  action: '动作',
  startTime: '开始时间',
  endTime: '结束时间',
}

const logs = ref<AuditLog[]>([])
const tableLoading = ref(true)
const page = ref(1)
const total = ref(0)
const totalPages = ref(1)

// 筛选条件（点击查询后生效）
const userId = ref('')
const status = ref('')
const action = ref('')
const startTime = ref('')
const endTime = ref('')
const query = ref({ userId: '', status: '', action: '', startTime: '', endTime: '' })

async function loadData() {
  tableLoading.value = true
  const res = await getAuditLogs({
    userId: query.value.userId,
    status: query.value.status,
    action: query.value.action,
    startTime: query.value.startTime,
    endTime: query.value.endTime,
    page: page.value,
    pageSize: PAGE_SIZE,
  })
  if (res.code === 0) {
    logs.value = res.data.list
    total.value = res.data.total
    totalPages.value = Math.max(1, Math.ceil(res.data.total / PAGE_SIZE))
  } else {
    toast.error(res.message || '加载数据失败')
  }
  tableLoading.value = false
}

watch(page, () => loadData())

onMounted(loadData)

function handleSearch() {
  page.value = 1
  query.value = {
    userId: userId.value.trim(),
    status: status.value,
    action: action.value.trim(),
    startTime: startTime.value,
    endTime: endTime.value,
  }
}

function handleReset() {
  userId.value = ''
  status.value = ''
  action.value = ''
  startTime.value = ''
  endTime.value = ''
  page.value = 1
  query.value = { userId: '', status: '', action: '', startTime: '', endTime: '' }
}

const activeFilters = computed<{ key: FilterKey; label: string; value: string }[]>(() => {
  const fields: { key: FilterKey; label: string; value: string }[] = [
    { key: 'userId', label: FILTER_LABELS.userId, value: query.value.userId },
    { key: 'status', label: FILTER_LABELS.status, value: query.value.status },
    { key: 'action', label: FILTER_LABELS.action, value: query.value.action },
    { key: 'startTime', label: FILTER_LABELS.startTime, value: query.value.startTime },
    { key: 'endTime', label: FILTER_LABELS.endTime, value: query.value.endTime },
  ]
  return fields.filter((f) => f.value)
})

function removeFilter(key: FilterKey) {
  const clearInput: Record<FilterKey, () => void> = {
    userId: () => (userId.value = ''),
    status: () => (status.value = ''),
    action: () => (action.value = ''),
    startTime: () => (startTime.value = ''),
    endTime: () => (endTime.value = ''),
  }
  clearInput[key]()
  query.value[key] = ''
  if (page.value === 1) {
    loadData()
  } else {
    page.value = 1
  }
}

function clearAllFilters() {
  handleReset()
}

function getStatusBadgeClass(s: string) {
  if (s === 'success') return 'badge badge-primary'
  if (s === 'fail') return 'badge badge-error'
  return 'badge badge-outline'
}

function getStatusLabel(s: string) {
  if (s === 'success') return '成功'
  if (s === 'fail') return '失败'
  return '权限不足'
}

function formatTime(value: string) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">审计日志</h1>
      <p class="text-base-content/50">查看系统的写操作与权限拦截记录。</p>
    </div>

    <PageSkeleton v-if="tableLoading" :cols="6" />

    <div v-else class="card border border-base-content/10 rounded-xl">
      <div class="card-body">
        <div class="flex flex-col gap-4">
          <div>
            <h3 class="card-title">操作记录</h3>
            <p class="text-sm text-base-content/50">共 {{ total }} 条记录</p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <input v-model="userId" placeholder="用户ID" class="input input-bordered input-sm w-36" />
            <input v-model="status" placeholder="状态" class="input input-bordered input-sm w-32" />
            <input v-model="action" placeholder="动作" class="input input-bordered input-sm w-48" />
            <input v-model="startTime" type="datetime-local" aria-label="开始时间" title="开始时间" class="input input-bordered input-sm w-44" />
            <input v-model="endTime" type="datetime-local" aria-label="结束时间" title="结束时间" class="input input-bordered input-sm w-44" />
            <button class="btn btn-primary btn-sm shrink-0" @click="handleSearch">
              <Search class="size-4" />
              查询
            </button>
            <button class="btn btn-outline btn-sm shrink-0" @click="handleReset">
              <RotateCcw class="size-4" />
              重置
            </button>
          </div>

          <div v-if="activeFilters.length" class="flex flex-wrap items-center gap-2" aria-label="当前筛选条件">
            <span class="text-xs text-base-content/50">当前筛选:</span>
            <button
              v-for="f in activeFilters"
              :key="f.key"
              type="button"
              class="badge badge-outline badge-sm gap-1 rounded-full py-2 pl-3 pr-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 hover:border-error/40 hover:text-error"
              :title="`移除筛选：${f.label}`"
              @click="removeFilter(f.key)"
            >
              {{ f.label }}: <span class="font-medium">{{ f.value }}</span>
              <X class="size-3 rounded-full bg-base-content/10" />
            </button>
            <button
              type="button"
              class="rounded-sm text-xs text-base-content/50 underline-offset-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 hover:text-base-content hover:underline"
              @click="clearAllFilters"
            >
              清除全部
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>时间</th>
                <th>操作者</th>
                <th>动作</th>
                <th>IP</th>
                <th>状态</th>
                <th>详情</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in logs" :key="log.id">
                <td class="whitespace-nowrap text-base-content/50">{{ formatTime(log.createdAt) }}</td>
                <td>{{ log.username || '未知' }}</td>
                <td class="font-mono text-xs">{{ log.action }}</td>
                <td class="text-base-content/50">{{ log.ip || '-' }}</td>
                <td>
                  <span :class="getStatusBadgeClass(log.status)">{{ getStatusLabel(log.status) }}</span>
                </td>
                <td class="max-w-[240px] truncate text-base-content/50">{{ log.detail || '-' }}</td>
              </tr>
              <tr v-if="logs.length === 0">
                <td colspan="6" class="text-center text-base-content/50">
                  {{ activeFilters.length ? '没有符合条件的记录，试着放宽筛选条件' : '暂无审计记录，系统的写操作和权限拦截会自动记录在这里' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Pagination :page="page" :total-pages="totalPages" @update:page="page = $event" />
      </div>
    </div>
  </div>
</template>