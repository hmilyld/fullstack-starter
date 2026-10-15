<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/use-toast'
import { exportData, getImportStatus, startImport, type ImportStatus } from '@/api/data-management'
import { Check, Copy, Download, FileArchive, Upload } from 'lucide-vue-next'

type ExportResult = {
  filename: string
  password: string
}

type ImportJob = {
  jobId: string
  jobToken: string
  status: ImportStatus
}

const auth = useAuthStore()
const toast = useToast()
const exportLoading = ref(false)
const exportResult = ref<ExportResult | null>(null)
const passwordCopied = ref(false)
const importFile = ref<File | null>(null)
const importPassword = ref('')
const importOpen = ref(false)
const importLoading = ref(false)
const importJob = ref<ImportJob | null>(null)
let pollTimer: number | null = null

async function handleExport() {
  exportLoading.value = true
  try {
    const result = await exportData()
    const url = URL.createObjectURL(result.blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = result.filename
    anchor.click()
    URL.revokeObjectURL(url)
    passwordCopied.value = false
    exportResult.value = result
  } catch (error) {
    toast.error((error as Error).message || '导出失败')
  }
  exportLoading.value = false
}

async function copyPassword() {
  if (!exportResult.value) return
  await navigator.clipboard.writeText(exportResult.value.password)
  passwordCopied.value = true
  toast.success('密码已复制')
}

function pickImportFile(event: Event) {
  importFile.value = (event.target as HTMLInputElement).files?.[0] || null
}

function openImport() {
  importFile.value = null
  importPassword.value = ''
  importOpen.value = true
}

function closeExport() {
  exportResult.value = null
  passwordCopied.value = false
}

async function handleStartImport() {
  if (!importFile.value || !importPassword.value) return
  importLoading.value = true
  try {
    const response = await startImport(importFile.value, importPassword.value)
    if (response.code !== 0) {
      toast.error(response.message || '导入任务创建失败')
      return
    }
    importJob.value = {
      jobId: response.data.jobId,
      jobToken: response.data.jobToken,
      status: {
        id: response.data.jobId,
        status: 'queued',
        message: '等待导入',
        progress: 0,
      },
    }
    pollTimer = window.setInterval(pollImport, 1000)
    await pollImport()
  } catch (error) {
    toast.error((error as Error).message || '导入任务创建失败')
  }
  importLoading.value = false
}

async function pollImport() {
  if (!importJob.value || ['success', 'failed'].includes(importJob.value.status.status)) return
  try {
    const response = await getImportStatus(importJob.value.jobId, importJob.value.jobToken)
    if (response.code !== 0) return
    importJob.value.status = response.data
    if (response.data.status === 'success') {
      stopPolling()
      toast.success(response.data.message || '导入完成')
      auth.logout()
      window.location.href = '/login'
    } else if (response.data.status === 'failed') {
      stopPolling()
      toast.error(response.data.message || '导入失败')
      importJob.value = null
      importOpen.value = false
    }
  } catch {
    // Status polling resumes while the import lock changes.
  }
}

function stopPolling() {
  if (pollTimer !== null) {
    window.clearInterval(pollTimer)
    pollTimer = null
  }
}

onUnmounted(stopPolling)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">数据管理</h1>
      <p class="text-base-content/50">导出或恢复当前系统的完整数据。</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <div v-if="auth.hasPermission('data_management.export')" class="card rounded-xl border border-base-content/10">
        <div class="card-body">
          <div class="flex items-center gap-3">
            <div class="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Download class="size-5 text-primary" />
            </div>
            <div>
              <h3 class="card-title">导出数据</h3>
              <p class="text-sm text-base-content/50">生成加密压缩包并下载到当前设备。</p>
            </div>
          </div>
          <div class="card-actions justify-end">
            <button class="btn btn-primary btn-sm" :disabled="exportLoading" @click="handleExport">
              <span v-if="exportLoading" class="loading loading-spinner loading-sm"></span>
              <Download v-else class="size-4" />
              生成并下载
            </button>
          </div>
        </div>
      </div>

      <div v-if="auth.hasPermission('data_management.import')" class="card rounded-xl border border-base-content/10">
        <div class="card-body">
          <div class="flex items-center gap-3">
            <div class="flex size-10 items-center justify-center rounded-lg bg-error/10">
              <Upload class="size-5 text-error" />
            </div>
            <div>
              <h3 class="card-title">导入数据</h3>
              <p class="text-sm text-base-content/50">使用同版本导出包覆盖当前系统数据。</p>
            </div>
          </div>
          <div class="card-actions justify-end">
            <button
              class="btn btn-error btn-outline btn-sm"
              @click="openImport"
            >
              <Upload class="size-4" />
              选择导入包
            </button>
          </div>
        </div>
      </div>
    </div>

    <dialog :class="{ modal: true, 'modal-open': !!exportResult }">
      <div class="modal-box">
        <h3 class="text-lg font-bold">导出完成</h3>
        <p class="text-sm text-base-content/50">
          该密码只显示一次，关闭后无法再次查看。请先复制并妥善保存。
        </p>
        <div class="mt-4 flex flex-col gap-3">
          <div class="flex items-center gap-2 rounded-lg border border-base-content/10 bg-base-200/40 p-3">
            <FileArchive class="size-5 shrink-0" />
            <span class="min-w-0 flex-1 truncate text-sm">{{ exportResult?.filename }}</span>
          </div>
          <div class="flex items-center gap-2">
            <input class="input input-bordered w-full font-mono" readonly :value="exportResult?.password" />
            <button class="btn btn-outline btn-square" @click="copyPassword">
              <Check v-if="passwordCopied" class="size-4" />
              <Copy v-else class="size-4" />
            </button>
          </div>
        </div>
        <div class="modal-action">
          <button
            class="btn btn-primary"
            @click="closeExport"
          >
            我已保存
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button
          @click="closeExport"
        >
          close
        </button>
      </form>
    </dialog>

    <dialog :class="{ modal: true, 'modal-open': importOpen }">
      <div class="modal-box">
        <h3 class="text-lg font-bold">导入完整数据</h3>
        <p class="text-sm text-base-content/50">
          导入会覆盖用户、角色、配置、AI 密钥、审计日志和菜单数据，并使所有登录会话失效。
        </p>
        <div class="mt-4 flex flex-col gap-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">导出包</legend>
            <input
              type="file"
              accept=".zip,application/zip"
              class="file-input file-input-bordered w-full"
              :disabled="!!importJob"
              @change="pickImportFile"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">压缩密码</legend>
            <input
              v-model="importPassword"
              type="password"
              class="input input-bordered w-full"
              :disabled="!!importJob"
            />
            <p class="label">密码遗失后无法恢复，只能重新导出。</p>
          </fieldset>
          <div v-if="importJob" class="flex flex-col gap-2 rounded-lg border border-base-content/10 p-3">
            <div class="flex items-center justify-between text-sm">
              <span>{{ importJob.status.message }}</span>
              <span>{{ importJob.status.progress }}%</span>
            </div>
            <progress
              class="progress progress-primary w-full"
              :value="importJob.status.progress"
              max="100"
            ></progress>
          </div>
        </div>
        <div class="modal-action">
          <button class="btn" :disabled="!!importJob" @click="importOpen = false">取消</button>
          <button
            class="btn btn-error"
            :disabled="!importFile || !importPassword || !!importJob || importLoading"
            @click="handleStartImport"
          >
            <span v-if="importLoading" class="loading loading-spinner loading-sm"></span>
            确认导入
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button :disabled="!!importJob" @click="importOpen = false">close</button>
      </form>
    </dialog>
  </div>
</template>
