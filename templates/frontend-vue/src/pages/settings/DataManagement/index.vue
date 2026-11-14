<script setup lang="ts">
import { onUnmounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import { Check, Copy, Download, FileArchive, Upload } from "@lucide/vue"
import LoadingButton from "@/components/shared/LoadingButton.vue"
import PageHeader from "@/components/shared/PageHeader.vue"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { exportData, getImportStatus, startImport } from "@/api/data-management"
import { useAuthStore } from "@/stores/auth"
import { useToast } from "@/composables/use-toast"
import { saveBlob } from "@/lib/download"
import type { ExportResult, ImportStatus } from "@/types/data-management"

/** 导出成功后展示给用户的信息（文件已保存到本地） */
type ExportedFile = Pick<ExportResult, "filename" | "password">

type ImportJob = {
  jobId: string
  jobToken: string
  status: ImportStatus
}

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const exportLoading = ref(false)
const exportResult = ref<ExportedFile | null>(null)
const passwordCopied = ref(false)
const importFile = ref<File | null>(null)
const importPassword = ref("")
const importOpen = ref(false)
const importLoading = ref(false)
const importJob = ref<ImportJob | null>(null)
let pollTimer: number | null = null

function stopPolling() {
  if (pollTimer !== null) {
    window.clearInterval(pollTimer)
    pollTimer = null
  }
}

onUnmounted(stopPolling)

async function handleExport() {
  exportLoading.value = true
  try {
    const result = await exportData()
    saveBlob(result.blob, result.filename)
    passwordCopied.value = false
    exportResult.value = {
      filename: result.filename,
      password: result.password,
    }
  } catch (error) {
    toast.error((error as Error).message || t("dataPage.export.failed"))
  }
  exportLoading.value = false
}

async function copyPassword() {
  if (!exportResult.value) return
  await navigator.clipboard.writeText(exportResult.value.password)
  passwordCopied.value = true
  toast.success(t("dataPage.exportDialog.copied"))
}

function closeExport() {
  exportResult.value = null
  passwordCopied.value = false
}

function handleExportOpenChange(open: boolean) {
  if (!open) closeExport()
}

function disposeImport() {
  importFile.value = null
  importPassword.value = ""
  importOpen.value = true
}

function pickImportFile(event: Event) {
  importFile.value = (event.target as HTMLInputElement).files?.[0] || null
}

async function pollImport() {
  if (
    !importJob.value ||
    ["success", "failed"].includes(importJob.value.status.status)
  )
    return
  try {
    const response = await getImportStatus(
      importJob.value.jobId,
      importJob.value.jobToken
    )
    if (response.code !== 0) return
    importJob.value.status = response.data
    if (response.data.status === "success") {
      stopPolling()
      toast.success(response.data.message || t("dataPage.import.success"))
      auth.logout()
      await router.replace("/login")
    } else if (response.data.status === "failed") {
      stopPolling()
      toast.error(response.data.message || t("dataPage.import.failed"))
      importJob.value = null
      importOpen.value = false
    }
  } catch {
    // 冻结切换期间状态接口可能短暂失败，下一轮轮询会重试
  }
}

async function handleStartImport() {
  if (!importFile.value || !importPassword.value) return
  importLoading.value = true
  try {
    const response = await startImport(importFile.value, importPassword.value)
    if (response.code !== 0) {
      toast.error(response.message || t("dataPage.import.createFailed"))
      return
    }
    importJob.value = {
      jobId: response.data.jobId,
      jobToken: response.data.jobToken,
      status: {
        id: response.data.jobId,
        status: "queued",
        message: t("dataPage.import.waiting"),
        progress: 0,
      },
    }
    stopPolling()
    pollTimer = window.setInterval(pollImport, 1000)
    await pollImport()
  } catch (error) {
    toast.error((error as Error).message || t("dataPage.import.createFailed"))
  } finally {
    importLoading.value = false
  }
}

function importStatusLabel(status: ImportStatus["status"]) {
  return t(`dataPage.status.${status}`)
}

function importBadgeVariant(status: ImportStatus["status"]) {
  if (status === "success") return "success"
  if (status === "failed") return "destructive"
  return "secondary"
}

function handleImportOpenChange(open: boolean) {
  if (!importJob.value) importOpen.value = open
}
</script>

<template>
  <div class="flex flex-col gap-(--page-gap)">
    <PageHeader
      :title="t('dataPage.title')"
      :description="t('dataPage.description')"
    />

    <div class="grid gap-6 md:grid-cols-2">
      <Card v-if="auth.hasPermission('data_management.export')">
        <CardHeader>
          <div class="flex items-center gap-3">
            <div
              class="flex size-10 items-center justify-center rounded-xl bg-primary/10"
            >
              <Download class="size-5 text-primary" />
            </div>
            <div>
              <CardTitle>{{ t("dataPage.export.title") }}</CardTitle>
              <CardDescription>
                {{ t("dataPage.export.description") }}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <LoadingButton
            :loading="exportLoading"
            class="w-full md:w-auto"
            @click="handleExport"
          >
            <Download data-icon="inline-start" />
            {{ t("dataPage.export.action") }}
          </LoadingButton>
        </CardContent>
      </Card>

      <Card v-if="auth.hasPermission('data_management.import')">
        <CardHeader>
          <div class="flex items-center gap-3">
            <div
              class="flex size-10 items-center justify-center rounded-xl bg-destructive/10"
            >
              <Upload class="size-5 text-destructive" />
            </div>
            <div>
              <CardTitle>{{ t("dataPage.import.title") }}</CardTitle>
              <CardDescription>
                {{ t("dataPage.import.description") }}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            class="w-full md:w-auto"
            @click="disposeImport"
          >
            <Upload data-icon="inline-start" />
            {{ t("dataPage.import.open") }}
          </Button>
        </CardContent>
      </Card>
    </div>

    <Dialog :open="!!exportResult" @update:open="handleExportOpenChange">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t("dataPage.exportDialog.title") }}</DialogTitle>
          <DialogDescription>
            {{ t("dataPage.exportDialog.description") }}
          </DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-3">
          <div
            class="flex items-center gap-2 rounded-xl border bg-muted/40 p-3"
          >
            <FileArchive class="size-5 shrink-0" />
            <span class="min-w-0 flex-1 truncate text-sm">
              {{ exportResult?.filename }}
            </span>
          </div>
          <Field>
            <FieldLabel for="export-password">{{
              t("dataPage.exportDialog.password")
            }}</FieldLabel>
            <div class="flex items-center gap-2">
              <Input
                id="export-password"
                name="export-password"
                autocomplete="off"
                readonly
                :model-value="exportResult?.password || ''"
                class="font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                :aria-label="t('dataPage.exportDialog.copyAria')"
                @click="copyPassword"
              >
                <Check v-if="passwordCopied" />
                <Copy v-else />
              </Button>
            </div>
          </Field>
        </div>
        <DialogFooter>
          <Button @click="closeExport">{{
            t("dataPage.exportDialog.saved")
          }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog :open="importOpen" @update:open="handleImportOpenChange">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t("dataPage.importDialog.title") }}</DialogTitle>
          <DialogDescription>
            {{ t("dataPage.importDialog.description") }}
          </DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-4">
          <Field>
            <FieldLabel for="import-file">{{
              t("dataPage.importDialog.file")
            }}</FieldLabel>
            <Input
              id="import-file"
              name="import-file"
              autocomplete="off"
              type="file"
              accept=".zip,application/zip"
              :disabled="!!importJob"
              @change="pickImportFile"
            />
          </Field>
          <Field>
            <FieldLabel for="import-password">{{
              t("dataPage.importDialog.password")
            }}</FieldLabel>
            <Input
              id="import-password"
              v-model="importPassword"
              name="import-password"
              type="password"
              autocomplete="off"
              :disabled="!!importJob"
            />
            <FieldDescription>
              {{ t("dataPage.importDialog.passwordHint") }}
            </FieldDescription>
          </Field>
          <div
            v-if="importJob"
            class="flex flex-col gap-2 rounded-xl border p-3"
          >
            <div class="flex items-center justify-between gap-2 text-sm">
              <div class="flex items-center gap-2">
                <Badge :variant="importBadgeVariant(importJob.status.status)">
                  {{ importStatusLabel(importJob.status.status) }}
                </Badge>
                <span class="text-muted-foreground">
                  {{ importJob.status.message }}
                </span>
              </div>
              <span class="tabular-nums">{{ importJob.status.progress }}%</span>
            </div>
            <Progress :model-value="importJob.status.progress" />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            :disabled="!!importJob"
            @click="importOpen = false"
          >
            {{ t("dataPage.importDialog.cancel") }}
          </Button>
          <LoadingButton
            variant="destructive"
            :loading="importLoading"
            :disabled="!importFile || !importPassword || !!importJob"
            @click="handleStartImport"
          >
            {{ t("dataPage.importDialog.confirm") }}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
