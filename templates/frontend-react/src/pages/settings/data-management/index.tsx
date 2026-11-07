import * as React from "react"
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
import {
  exportData,
  getImportStatus,
  startImport,
  type ImportStatus,
} from "@/api/data-management"
import { useAuth } from "@/lib/auth-context"
import { appToast } from "@/lib/toast"

type ExportResult = {
  filename: string
  password: string
}

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

function getImportBadgeVariant(status: ImportStatus["status"]) {
  if (status === "success") return "success" as const
  if (status === "failed") return "destructive" as const
  return "secondary" as const
}

export function DataManagementPage() {
  const navigate = useNavigate()
  const { hasPermission, logout } = useAuth()
  const [exportLoading, setExportLoading] = React.useState(false)
  const [exportResult, setExportResult] = React.useState<ExportResult | null>(
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
      const url = URL.createObjectURL(result.blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = result.filename
      anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
      setPasswordCopied(false)
      setExportResult({
        filename: result.filename,
        password: result.password,
      })
    } catch (error) {
      appToast.error((error as Error).message || "导出失败")
    }
    setExportLoading(false)
  }

  async function copyPassword() {
    if (!exportResult) return
    await navigator.clipboard.writeText(exportResult.password)
    setPasswordCopied(true)
    appToast.success("密码已复制")
  }

  async function handleStartImport() {
    if (!importFile || !importPassword) return
    setImportLoading(true)
    try {
      const response = await startImport(importFile, importPassword)
      if (response.code !== 0) {
        appToast.error(response.message || "导入任务创建失败")
        return
      }
      setImportJob({
        jobId: response.data.jobId,
        jobToken: response.data.jobToken,
        status: {
          id: response.data.jobId,
          status: "queued",
          message: "等待导入",
          progress: 0,
        },
      })
    } catch (error) {
      appToast.error((error as Error).message || "导入任务创建失败")
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
          appToast.success(response.data.message || "导入完成")
          logout()
          navigate("/login", { replace: true })
        } else if (response.data.status === "failed") {
          appToast.error(response.data.message || "导入失败")
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
  }, [jobId, jobToken, logout, navigate])

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <PageHeader
        title="数据管理"
        description="导出或恢复当前系统的完整数据。"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {hasPermission("data_management.export") && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <DownloadIcon className="size-5 text-primary" />
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
              <LoadingButton loading={exportLoading} onClick={handleExport}>
                <DownloadIcon data-icon="inline-start" />
                生成并下载
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
                onClick={() => {
                  setImportFile(null)
                  setImportPassword("")
                  setImportOpen(true)
                }}
              >
                <UploadIcon data-icon="inline-start" />
                选择导入包
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
            <DialogTitle>导出完成</DialogTitle>
            <DialogDescription>
              该密码只显示一次，关闭后无法再次查看。请先复制并妥善保存。
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
              <FieldLabel htmlFor="export-password">压缩密码</FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="export-password"
                  readOnly
                  value={exportResult?.password || ""}
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="复制压缩密码"
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
              我已保存
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
            <DialogTitle>导入完整数据</DialogTitle>
            <DialogDescription>
              导入会覆盖用户、角色、配置、AI
              密钥、审计日志和菜单数据，并使所有登录会话失效。
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="import-file">导出包</FieldLabel>
              <Input
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
              <FieldLabel htmlFor="import-password">压缩密码</FieldLabel>
              <Input
                id="import-password"
                type="password"
                value={importPassword}
                disabled={!!importJob}
                autoComplete="off"
                onChange={(event) => setImportPassword(event.target.value)}
              />
              <FieldDescription>
                密码遗失后无法恢复，只能重新导出。
              </FieldDescription>
            </Field>
            {importJob && (
              <div className="flex flex-col gap-2 rounded-xl border p-3">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={getImportBadgeVariant(importJob.status.status)}
                    >
                      {IMPORT_STATUS_LABELS[importJob.status.status]}
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
              取消
            </Button>
            <LoadingButton
              variant="destructive"
              loading={importLoading}
              disabled={!importFile || !importPassword || !!importJob}
              onClick={handleStartImport}
            >
              确认导入
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
