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
  import { t } from "#lib/i18n.js"
  import { useToast } from "#lib/hooks/use-toast.js"
  import { auth } from "#lib/stores/auth.svelte.js"
  import { siteConfig } from "#lib/stores/site-config.svelte.js"
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

  function importStatusLabel(status: ImportStatus["status"]) {
    return $t(`dataPage.status.${status}`, { defaultValue: status })
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
      toast.error((error as Error).message || $t("dataPage.export.failed"))
    }
    exportLoading = false
  }

  async function copyPassword() {
    const current = exportResult
    if (!current) return
    await navigator.clipboard.writeText(current.password)
    passwordCopied = true
    toast.success($t("dataPage.exportDialog.copied"))
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
        toast.success(response.data.message || $t("dataPage.import.success"))
        auth.logout()
        await goto(resolve("login"), { replace: true })
      } else if (response.data.status === "failed") {
        stopPolling()
        toast.error(response.data.message || $t("dataPage.import.failed"))
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
        toast.error(response.message || $t("dataPage.import.createFailed"))
        return
      }
      importJob = {
        jobId: response.data.jobId,
        jobToken: response.data.jobToken,
        status: {
          id: response.data.jobId,
          status: "queued",
          message: $t("dataPage.import.waiting"),
          progress: 0,
        },
      }
      stopPolling()
      pollTimer = window.setInterval(() => {
        void pollImport()
      }, 1000)
      await pollImport()
    } catch (error) {
      toast.error(
        (error as Error).message || $t("dataPage.import.createFailed")
      )
    } finally {
      importLoading = false
    }
  }

  function importBadgeVariant(
    status: ImportStatus["status"]
  ): "success" | "destructive" | "secondary" {
    if (status === "success") return "success"
    if (status === "failed") return "destructive"
    return "secondary"
  }

  function handleImportOpenChange(open: boolean) {
    if (!importJob) importOpen = open
  }
</script>

<svelte:head
  ><title
    >{$t("dataPage.title")} · {siteConfig.config?.siteName?.trim() ||
      $t("pwa.defaultName")}</title
  ></svelte:head
>

<div class="flex flex-col gap-(--page-gap)">
  <PageHeader
    title={$t("dataPage.title")}
    description={$t("dataPage.description")}
  />

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
              <CardTitle>{$t("dataPage.export.title")}</CardTitle>
              <CardDescription
                >{$t("dataPage.export.description")}</CardDescription
              >
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
            {$t("dataPage.export.action")}
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
              <CardTitle>{$t("dataPage.import.title")}</CardTitle>
              <CardDescription
                >{$t("dataPage.import.description")}</CardDescription
              >
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
            {$t("dataPage.import.open")}
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
        <DialogTitle>{$t("dataPage.exportDialog.title")}</DialogTitle>
        <DialogDescription
          >{$t("dataPage.exportDialog.description")}</DialogDescription
        >
      </DialogHeader>
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2 rounded-xl border bg-muted/40 p-3">
          <FileArchive class="size-5 shrink-0" />
          <span class="min-w-0 flex-1 truncate text-sm">
            {exportResult?.filename}
          </span>
        </div>
        <Field>
          <FieldLabel for="export-password"
            >{$t("dataPage.exportDialog.password")}</FieldLabel
          >
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
              aria-label={$t("dataPage.exportDialog.copyAria")}
              onclick={() => void copyPassword()}
            >
              {#if passwordCopied}<Check />{:else}<Copy />{/if}
            </Button>
          </div>
        </Field>
      </div>
      <DialogFooter>
        <Button onclick={closeExport}
          >{$t("dataPage.exportDialog.saved")}</Button
        >
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Dialog open={importOpen} onOpenChange={handleImportOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{$t("dataPage.importDialog.title")}</DialogTitle>
        <DialogDescription
          >{$t("dataPage.importDialog.description")}</DialogDescription
        >
      </DialogHeader>
      <div class="flex flex-col gap-4">
        <Field>
          <FieldLabel for="import-file"
            >{$t("dataPage.importDialog.file")}</FieldLabel
          >
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
          <FieldLabel for="import-password"
            >{$t("dataPage.importDialog.password")}</FieldLabel
          >
          <Input
            id="import-password"
            bind:value={importPassword}
            name="import-password"
            type="password"
            autocomplete="off"
            disabled={!!importJob}
          />
          <FieldDescription
            >{$t("dataPage.importDialog.passwordHint")}</FieldDescription
          >
        </Field>
        {#if importJob}
          <div class="flex flex-col gap-2 rounded-xl border p-3">
            <div class="flex items-center justify-between gap-2 text-sm">
              <div class="flex items-center gap-2">
                <Badge variant={importBadgeVariant(importJob.status.status)}>
                  {importStatusLabel(importJob.status.status)}
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
          {$t("dataPage.importDialog.cancel")}
        </Button>
        <LoadingButton
          variant="destructive"
          loading={importLoading}
          disabled={!importFile || !importPassword || !!importJob}
          onclick={() => void handleStartImport()}
        >
          {$t("dataPage.importDialog.confirm")}
        </LoadingButton>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</div>
