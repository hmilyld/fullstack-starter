import * as React from "react"
import { useTranslation } from "react-i18next"
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  FileArchiveIcon,
  UploadIcon,
} from "lucide-react"
import { useNavigate } from "react-router"

import { LoadingButton } from "@/components/shared/loading-button"
import { PageHeader } from "@/components/shared/page-header"
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
import type { ExportResult, ImportStatus } from "@/types/data-management"
import { useAuth } from "@/lib/auth-context"
import { saveBlob } from "@/lib/download"
import { appToast } from "@/lib/toast"

/** 导出成功后展示给用户的信息（文件已保存到本地） */
type ExportedFile = Pick<ExportResult, "filename" | "password">

type ImportJob = {
  jobId: string
  jobToken: string
  status: ImportStatus
}

const IMPORT_STATUS_KEYS: Record<ImportStatus["status"], string> = {
  queued: "dataPage.status.queued",
  running: "dataPage.status.running",
  success: "dataPage.status.success",
  failed: "dataPage.status.failed",
}

function getImportBadgeVariant(status: ImportStatus["status"]) {
  if (status === "success") return "success" as const
  if (status === "failed") return "destructive" as const
  return "secondary" as const
}

export function DataManagementPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { hasPermission, logout } = useAuth()
  const [exportLoading, setExportLoading] = React.useState(false)
  const [exportResult, setExportResult] = React.useState<ExportedFile | null>(
    null
  )
  const [passwordCopied, setPasswordCopied] = React.useState(false)
  const [importFile, setImportFile] = React.useState<File | null>(null)
  const [importPassword, setImportPassword] = React.useState("")
  const [importOpen, setImportOpen] = React.useState(false)
  const [importLoading, setImportLoading] = React.useState(false)
  const [importJob, setImportJob] = React.useState<ImportJob | null>(null)

  async function handleExport() {
    setExportLoading(true)
    try {
      const result = await exportData()
      saveBlob(result.blob, result.filename)
      setPasswordCopied(false)
      setExportResult({
        filename: result.filename,
        password: result.password,
      })
    } catch (error) {
      appToast.error((error as Error).message || t("dataPage.export.failed"))
    }
    setExportLoading(false)
  }

  async function copyPassword() {
    if (!exportResult) return
    await navigator.clipboard.writeText(exportResult.password)
    setPasswordCopied(true)
    appToast.success(t("dataPage.exportDialog.copied"))
  }

  async function handleStartImport() {
    if (!importFile || !importPassword) return
    setImportLoading(true)
    try {
      const response = await startImport(importFile, importPassword)
      if (response.code !== 0) {
        appToast.error(response.message || t("dataPage.import.createFailed"))
        return
      }
      setImportJob({
        jobId: response.data.jobId,
        jobToken: response.data.jobToken,
        status: {
          id: response.data.jobId,
          status: "queued",
          message: t("dataPage.import.waiting"),
          progress: 0,
        },
      })
    } catch (error) {
      appToast.error(
        (error as Error).message || t("dataPage.import.createFailed")
      )
    } finally {
      setImportLoading(false)
    }
  }

  const jobId = importJob?.jobId
  const jobToken = importJob?.jobToken

  React.useEffect(() => {
    if (!jobId || !jobToken) return
    let cancelled = false
    const poll = async () => {
      try {
        const response = await getImportStatus(jobId, jobToken)
        if (cancelled || response.code !== 0) return
        setImportJob((current) =>
          current ? { ...current, status: response.data } : current
        )
        if (response.data.status === "success") {
          appToast.success(
            response.data.message || t("dataPage.import.success")
          )
          logout()
          navigate("/login", { replace: true })
        } else if (response.data.status === "failed") {
          appToast.error(response.data.message || t("dataPage.import.failed"))
          setImportJob(null)
          setImportOpen(false)
        }
      } catch {
        // 冻结切换期间状态接口可能短暂失败，下一轮轮询会重试
      }
    }
    void poll()
    const timer = window.setInterval(poll, 1000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [jobId, jobToken, logout, navigate, t])

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <PageHeader
        title={t("dataPage.title")}
        description={t("dataPage.description")}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {hasPermission("data_management.export") && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <DownloadIcon className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{t("dataPage.export.title")}</CardTitle>
                  <CardDescription>
                    {t("dataPage.export.description")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <LoadingButton
                loading={exportLoading}
                onClick={handleExport}
                className="w-full md:w-auto"
              >
                <DownloadIcon data-icon="inline-start" />
                {t("dataPage.export.action")}
              </LoadingButton>
            </CardContent>
          </Card>
        )}

        {hasPermission("data_management.import") && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10">
                  <UploadIcon className="size-5 text-destructive" />
                </div>
                <div>
                  <CardTitle>{t("dataPage.import.title")}</CardTitle>
                  <CardDescription>
                    {t("dataPage.import.description")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                className="w-full md:w-auto"
                onClick={() => {
                  setImportFile(null)
                  setImportPassword("")
                  setImportOpen(true)
                }}
              >
                <UploadIcon data-icon="inline-start" />
                {t("dataPage.import.open")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog
        open={!!exportResult}
        onOpenChange={(open) => {
          if (!open) {
            setExportResult(null)
            setPasswordCopied(false)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dataPage.exportDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("dataPage.exportDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-xl border bg-muted/40 p-3">
              <FileArchiveIcon className="size-5 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-sm">
                {exportResult?.filename}
              </span>
            </div>
            <Field>
              <FieldLabel htmlFor="export-password">
                {t("dataPage.exportDialog.password")}
              </FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  name="export-password"
                  autoComplete="off"
                  id="export-password"
                  readOnly
                  value={exportResult?.password || ""}
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={t("dataPage.exportDialog.copyAria")}
                  onClick={copyPassword}
                >
                  {passwordCopied ? <CheckIcon /> : <CopyIcon />}
                </Button>
              </div>
            </Field>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setExportResult(null)
                setPasswordCopied(false)
              }}
            >
              {t("dataPage.exportDialog.saved")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={importOpen}
        onOpenChange={(open) => {
          if (!importJob) setImportOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dataPage.importDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("dataPage.importDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="import-file">
                {t("dataPage.importDialog.file")}
              </FieldLabel>
              <Input
                name="import-file"
                autoComplete="off"
                id="import-file"
                type="file"
                accept=".zip,application/zip"
                disabled={!!importJob}
                onChange={(event) =>
                  setImportFile(event.target.files?.[0] || null)
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="import-password">
                {t("dataPage.importDialog.password")}
              </FieldLabel>
              <Input
                name="import-password"
                id="import-password"
                type="password"
                value={importPassword}
                disabled={!!importJob}
                autoComplete="off"
                onChange={(event) => setImportPassword(event.target.value)}
              />
              <FieldDescription>
                {t("dataPage.importDialog.passwordHint")}
              </FieldDescription>
            </Field>
            {importJob && (
              <div className="flex flex-col gap-2 rounded-xl border p-3">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={getImportBadgeVariant(importJob.status.status)}
                    >
                      {t(IMPORT_STATUS_KEYS[importJob.status.status])}
                    </Badge>
                    <span className="text-muted-foreground">
                      {importJob.status.message}
                    </span>
                  </div>
                  <span className="tabular-nums">
                    {importJob.status.progress}%
                  </span>
                </div>
                <Progress value={importJob.status.progress} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={!!importJob}
              onClick={() => setImportOpen(false)}
            >
              {t("dataPage.importDialog.cancel")}
            </Button>
            <LoadingButton
              variant="destructive"
              loading={importLoading}
              disabled={!importFile || !importPassword || !!importJob}
              onClick={handleStartImport}
            >
              {t("dataPage.importDialog.confirm")}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
