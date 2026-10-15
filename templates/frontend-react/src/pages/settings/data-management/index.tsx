import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { LoadingButton } from "@/components/shared/loading-button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckIcon, CopyIcon, DownloadIcon, FileArchiveIcon, UploadIcon } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { appToast } from "@/lib/toast"
import { exportData, getImportStatus, startImport, type ImportStatus } from "@/api/data-management"

type ExportResult = {
  filename: string
  password: string
}

type ImportJob = {
  jobId: string
  jobToken: string
  status: ImportStatus
}

export function DataManagementPage() {
  const { hasPermission, logout } = useAuth()
  const [exportLoading, setExportLoading] = React.useState(false)
  const [exportResult, setExportResult] = React.useState<ExportResult | null>(null)
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
      URL.revokeObjectURL(url)
      setPasswordCopied(false)
      setExportResult({ filename: result.filename, password: result.password })
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
    let timer: number | undefined
    const poll = async () => {
      try {
        const response = await getImportStatus(jobId, jobToken)
        if (cancelled || response.code !== 0) return
        setImportJob((current) => (current ? { ...current, status: response.data } : current))
        if (response.data.status === "success") {
          appToast.success(response.data.message || "导入完成")
          logout()
          window.location.href = "/login"
        } else if (response.data.status === "failed") {
          window.clearInterval(timer)
          appToast.error(response.data.message || "导入失败")
          setImportJob(null)
          setImportOpen(false)
        }
      } catch {
        // The status endpoint may briefly race with the freeze transition.
      }
    }
    poll()
    timer = window.setInterval(poll, 1000)
    return () => {
      cancelled = true
      if (timer) window.clearInterval(timer)
    }
  }, [jobId, jobToken, logout])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">数据管理</h1>
        <p className="text-muted-foreground">导出或恢复当前系统的完整数据。</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {hasPermission("data_management.export") && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <DownloadIcon className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle>导出数据</CardTitle>
                  <CardDescription>生成加密压缩包并下载到当前设备。</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <LoadingButton loading={exportLoading} onClick={handleExport}>
                <DownloadIcon />
                生成并下载
              </LoadingButton>
            </CardContent>
          </Card>
        )}

        {hasPermission("data_management.import") && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
                  <UploadIcon className="size-5 text-destructive" />
                </div>
                <div>
                  <CardTitle>导入数据</CardTitle>
                  <CardDescription>使用同版本导出包覆盖当前系统数据。</CardDescription>
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
                <UploadIcon />
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
          <div className="flex flex-col gap-3 py-4">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3">
              <FileArchiveIcon className="size-5 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-sm">{exportResult?.filename}</span>
            </div>
            <div className="flex items-center gap-2">
              <Input readOnly value={exportResult?.password || ""} className="font-mono" />
              <Button variant="outline" size="icon" onClick={copyPassword}>
                {passwordCopied ? <CheckIcon /> : <CopyIcon />}
              </Button>
            </div>
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
              导入会覆盖用户、角色、配置、AI 密钥、审计日志和菜单数据，并使所有登录会话失效。
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Field>
              <FieldLabel>导出包</FieldLabel>
              <Input
                type="file"
                accept=".zip,application/zip"
                disabled={!!importJob}
                onChange={(event) => setImportFile(event.target.files?.[0] || null)}
              />
            </Field>
            <Field>
              <FieldLabel>压缩密码</FieldLabel>
              <Input
                type="password"
                value={importPassword}
                disabled={!!importJob}
                onChange={(event) => setImportPassword(event.target.value)}
              />
              <FieldDescription>密码遗失后无法恢复，只能重新导出。</FieldDescription>
            </Field>
            {importJob && (
              <div className="flex flex-col gap-2 rounded-lg border p-3">
                <div className="flex items-center justify-between text-sm">
                  <span>{importJob.status.message}</span>
                  <span>{importJob.status.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${importJob.status.progress}%` }}
                  />
                </div>
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
