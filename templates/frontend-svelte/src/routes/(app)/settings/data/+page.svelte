<script lang="ts">
  import { onDestroy } from "svelte"
  import { goto } from "$app/navigation"
  import { resolve } from "$app/paths"
  import { Check, Copy, Download, FileArchive, Upload } from "@lucide/svelte"
  import LoadingButton from "#lib/components/shared/loading-button.svelte"
  import PageHeader from "#lib/components/shared/page-header.svelte"
  import { Badge } from "#lib/components/ui/badge/index.js"
  import { Button } from "#lib/components/ui/button/index.js"
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "#lib/components/ui/card/index.js"
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "#lib/components/ui/dialog/index.js"
  import {
    Field,
    FieldDescription,
    FieldLabel,
  } from "#lib/components/ui/field/index.js"
  import { Input } from "#lib/components/ui/input/index.js"
  import { Progress } from "#lib/components/ui/progress/index.js"
  import {
    exportData,
    getImportStatus,
    startImport,
  } from "#lib/api/data-management.js"
  import { saveBlob } from "#lib/download.js"
  import { useToast } from "#lib/hooks/use-toast.js"
  import { auth } from "#lib/stores/auth.svelte.js"
  import type {
    ExportResult,
    ImportStatus,
  } from "#lib/types/data-management.js"

  /** 导出成功后展示给用户的信息（文件已保存到本地） */
  type ExportedFile = Pick<ExportResult, "filename" | "password">

  type ImportJob = {
    jobId: string
    jobToken: string
    status: ImportStatus
  }

  const IMPORT_STATUS_LABELS: Record<ImportStatus["status"], string> = {
    queued: "排队中",
    running: "导入中",
    success: "导入完成",
    failed: "导入失败",
  }

  const toast = useToast()

  let exportLoading = $state(false)
  let exportResult = $state<ExportedFile | null>(null)
  let passwordCopied = $state(false)
  let importFile = $state<File | null>(null)
  let importPassword = $state("")
  let importOpen = $state(false)
  let importLoading = $state(false)
  let importJob = $state<ImportJob | null>(null)
  let pollTimer: number | null = null

  function stopPolling() {
    if (pollTimer !== null) {
      window.clearInterval(pollTimer)
      pollTimer = null
    }
  }

  onDestroy(stopPolling)

  async function handleExport() {
    exportLoading = true
    try {
      const result = await exportData()
      saveBlob(result.blob, result.filename)
      passwordCopied = false
      exportResult = {
        filename: result.filename,
        password: result.password,
      }
    } catch (error) {
      toast.error((error as Error).message || "导出失败")
    }
    exportLoading = false
  }

  async function copyPassword() {
    const current = exportResult
    if (!current) return
    await navigator.clipboard.writeText(current.password)
    passwordCopied = true
    toast.success("密码已复制")
  }

  function closeExport() {
    exportResult = null
    passwordCopied = false
  }

  function disposeImport() {
    importFile = null
    importPassword = ""
    importOpen = true
  }

  function pickImportFile(event: Event) {
    importFile = (event.currentTarget as HTMLInputElement).files?.[0] ?? null
  }

  async function pollImport() {
    const job = importJob
    if (!job || ["success", "failed"].includes(job.status.status)) return
    try {
      const response = await getImportStatus(job.jobId, job.jobToken)
      if (response.code !== 0) return
      job.status = response.data
      if (response.data.status === "success") {
        stopPolling()
        toast.success(response.data.message || "导入完成")
        auth.logout()
        await goto(resolve("login"), { replace: true })
      } else if (response.data.status === "failed") {
        stopPolling()
        toast.error(response.data.message || "导入失败")
        importJob = null
        importOpen = false
      }
    } catch {
      // 冻结切换期间状态接口可能短暂失败，下一轮轮询会重试
    }
  }

  async function handleStartImport() {
    const file = importFile
    const password = importPassword
    if (!file || !password) return
    importLoading = true
    try {
      const response = await startImport(file, password)
      if (response.code !== 0) {
        toast.error(response.message || "导入任务创建失败")
        return
      }
      importJob = {
        jobId: response.data.jobId,
        jobToken: response.data.jobToken,
        status: {
          id: response.data.jobId,
          status: "queued",
          message: "等待导入",
          progress: 0,
        },
      }
      stopPolling()
      pollTimer = window.setInterval(() => {
        void pollImport()
      }, 1000)
      await pollImport()
    } catch (error) {
      toast.error((error as Error).message || "导入任务创建失败")
    } finally {
      importLoading = false
    }
  }

  function importBadgeVariant(
    status: ImportStatus["status"]
  ): "destructive" | "outline" | "secondary" {
    if (status === "success") return "outline"
    if (status === "failed") return "destructive"
    return "secondary"
  }

  function importBadgeClass(status: ImportStatus["status"]) {
    if (status === "success")
      return "border-transparent bg-success/10 text-success"
    return undefined
  }

  function handleImportOpenChange(open: boolean) {
    if (!importJob) importOpen = open
  }
</script>

<svelte:head><title>数据管理 · 管理系统</title></svelte:head>

<div class="flex flex-col gap-(--page-gap)">
  <PageHeader title="数据管理" description="导出或恢复当前系统的完整数据。" />

  <div class="grid gap-6 md:grid-cols-2">
    {#if auth.hasPermission("data_management.export")}
      <Card>
        <CardHeader>
          <div class="flex items-center gap-3">
            <div
              class="flex size-10 items-center justify-center rounded-xl bg-primary/10"
            >
              <Download class="size-5 text-primary" />
            </div>
            <div>
              <CardTitle>导出数据</CardTitle>
              <CardDescription>
                生成加密压缩包并下载到当前设备。
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <LoadingButton
            loading={exportLoading}
            class="w-full md:w-auto"
            onclick={() => void handleExport()}
          >
            <Download data-icon="inline-start" />
            生成并下载
          </LoadingButton>
        </CardContent>
      </Card>
    {/if}

    {#if auth.hasPermission("data_management.import")}
      <Card>
        <CardHeader>
          <div class="flex items-center gap-3">
            <div
              class="flex size-10 items-center justify-center rounded-xl bg-destructive/10"
            >
              <Upload class="size-5 text-destructive" />
            </div>
            <div>
              <CardTitle>导入数据</CardTitle>
              <CardDescription>
                使用同版本导出包覆盖当前系统数据。
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            class="w-full md:w-auto"
            onclick={disposeImport}
          >
            <Upload data-icon="inline-start" />
            选择导入包
          </Button>
        </CardContent>
      </Card>
    {/if}
  </div>

  <Dialog
    open={exportResult !== null}
    onOpenChange={(open) => {
      if (!open) closeExport()
    }}
  >
    <DialogContent>
      <DialogHeader>
        <DialogTitle>导出完成</DialogTitle>
        <DialogDescription>
          该密码只显示一次，关闭后无法再次查看。请先复制并妥善保存。
        </DialogDescription>
      </DialogHeader>
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2 rounded-xl border bg-muted/40 p-3">
          <FileArchive class="size-5 shrink-0" />
          <span class="min-w-0 flex-1 truncate text-sm">
            {exportResult?.filename}
          </span>
        </div>
        <Field>
          <FieldLabel for="export-password">压缩密码</FieldLabel>
          <div class="flex items-center gap-2">
            <Input
              id="export-password"
              name="export-password"
              autocomplete="off"
              readonly
              value={exportResult?.password || ""}
              class="font-mono"
            />
            <Button
              variant="outline"
              size="icon"
              aria-label="复制压缩密码"
              onclick={() => void copyPassword()}
            >
              {#if passwordCopied}<Check />{:else}<Copy />{/if}
            </Button>
          </div>
        </Field>
      </div>
      <DialogFooter>
        <Button onclick={closeExport}>我已保存</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Dialog open={importOpen} onOpenChange={handleImportOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>导入完整数据</DialogTitle>
        <DialogDescription>
          导入会覆盖用户、角色、配置、AI
          密钥、审计日志和菜单数据，并使所有登录会话失效。
        </DialogDescription>
      </DialogHeader>
      <div class="flex flex-col gap-4">
        <Field>
          <FieldLabel for="import-file">导出包</FieldLabel>
          <Input
            id="import-file"
            name="import-file"
            autocomplete="off"
            type="file"
            accept=".zip,application/zip"
            disabled={!!importJob}
            onchange={pickImportFile}
          />
        </Field>
        <Field>
          <FieldLabel for="import-password">压缩密码</FieldLabel>
          <Input
            id="import-password"
            bind:value={importPassword}
            name="import-password"
            type="password"
            autocomplete="off"
            disabled={!!importJob}
          />
          <FieldDescription>
            密码遗失后无法恢复，只能重新导出。
          </FieldDescription>
        </Field>
        {#if importJob}
          <div class="flex flex-col gap-2 rounded-xl border p-3">
            <div class="flex items-center justify-between gap-2 text-sm">
              <div class="flex items-center gap-2">
                <Badge
                  variant={importBadgeVariant(importJob.status.status)}
                  class={importBadgeClass(importJob.status.status)}
                >
                  {IMPORT_STATUS_LABELS[importJob.status.status]}
                </Badge>
                <span class="text-muted-foreground">
                  {importJob.status.message}
                </span>
              </div>
              <span class="tabular-nums">{importJob.status.progress}%</span>
            </div>
            <Progress value={importJob.status.progress} />
          </div>
        {/if}
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          disabled={!!importJob}
          onclick={() => (importOpen = false)}
        >
          取消
        </Button>
        <LoadingButton
          variant="destructive"
          loading={importLoading}
          disabled={!importFile || !importPassword || !!importJob}
          onclick={() => void handleStartImport()}
        >
          确认导入
        </LoadingButton>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</div>
