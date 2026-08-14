import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableEmptyRow, TableCardSkeleton } from "@/components/shared/table-states"
import { Pagination } from "@/components/shared/pagination"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { SearchIcon, RotateCcwIcon, XIcon } from "lucide-react"
import { appToast } from "@/lib/toast"
import type { AuditLog } from "@/types/api"
import { getAuditLogs } from "@/lib/api"

const PAGE_SIZE = 10

type FilterKey = "userId" | "status" | "action" | "startTime" | "endTime"
type AuditFilters = Record<FilterKey, string>

const FILTER_LABELS: Record<FilterKey, string> = {
  userId: "用户ID",
  status: "状态",
  action: "动作",
  startTime: "开始时间",
  endTime: "结束时间",
}

function getStatusBadge(status: AuditLog["status"]) {
  if (status === "success") return <Badge variant="default">成功</Badge>
  if (status === "fail") return <Badge variant="destructive">失败</Badge>
  return <Badge variant="outline">权限不足</Badge>
}

function formatTime(value: string) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString("zh-CN", { hour12: false })
}

export function AuditLogPage() {
  const [logs, setLogs] = React.useState<AuditLog[]>([])
  const [tableLoading, setTableLoading] = React.useState(true)

  // 筛选条件（点击查询后生效）
  const [userId, setUserId] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [action, setAction] = React.useState("")
  const [startTime, setStartTime] = React.useState("")
  const [endTime, setEndTime] = React.useState("")
  const [query, setQuery] = React.useState<AuditFilters>({
    userId: "",
    status: "",
    action: "",
    startTime: "",
    endTime: "",
  })

  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)

  const loadData = React.useCallback(async () => {
    setTableLoading(true)
    const res = await getAuditLogs({
      userId: query.userId,
      status: query.status,
      action: query.action,
      startTime: query.startTime,
      endTime: query.endTime,
      page,
      pageSize: PAGE_SIZE,
    })
    if (res.code === 0) {
      setLogs(res.data.list)
      setTotal(res.data.total)
    } else {
      appToast.error(res.message || "加载数据失败")
    }
    setTableLoading(false)
  }, [query, page])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  function handleSearch() {
    setPage(1)
    setQuery({ userId: userId.trim(), status, action: action.trim(), startTime, endTime })
  }

  function handleReset() {
    setUserId("")
    setStatus("")
    setAction("")
    setStartTime("")
    setEndTime("")
    setPage(1)
    setQuery({ userId: "", status: "", action: "", startTime: "", endTime: "" })
  }

  const activeFilters = (Object.keys(query) as FilterKey[])
    .filter((key) => query[key] !== "")
    .map((key) => ({ key, label: FILTER_LABELS[key], value: query[key] }))

  function removeFilter(key: FilterKey) {
    const clearInput: Record<FilterKey, () => void> = {
      userId: () => setUserId(""),
      status: () => setStatus(""),
      action: () => setAction(""),
      startTime: () => setStartTime(""),
      endTime: () => setEndTime(""),
    }
    clearInput[key]()
    setQuery((prev) => ({ ...prev, [key]: "" }))
    setPage(1)
  }

  function clearAllFilters() {
    handleReset()
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">审计日志</h1>
        <p className="text-muted-foreground">查看系统的写操作与权限拦截记录。</p>
      </div>

      {tableLoading ? (
        <TableCardSkeleton colSpan={6} />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div>
                <CardTitle>操作记录</CardTitle>
                <CardDescription>共 {total} 条记录</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="用户ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-36"
                />
                <Input
                  placeholder="状态"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-32"
                />
                <Input
                  placeholder="动作"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-48"
                />
                <Input
                  type="datetime-local"
                  aria-label="开始时间"
                  title="开始时间"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-44"
                />
                <Input
                  type="datetime-local"
                  aria-label="结束时间"
                  title="结束时间"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-44"
                />
                <Button onClick={handleSearch} className="shrink-0">
                  <SearchIcon data-icon="inline-start" />
                  查询
                </Button>
                <Button variant="outline" onClick={handleReset} className="shrink-0">
                  <RotateCcwIcon data-icon="inline-start" />
                  重置
                </Button>
              </div>
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-2" aria-label="当前筛选条件">
                  <span className="text-xs text-muted-foreground">当前筛选:</span>
                  {activeFilters.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => removeFilter(f.key)}
                      title={`移除筛选：${f.label}`}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-background py-1 pl-3 pr-1.5 text-xs transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 hover:border-destructive/40 hover:text-destructive"
                    >
                      <span>
                        {f.label}: <span className="font-medium">{f.value}</span>
                      </span>
                      <XIcon className="size-3.5 rounded-full bg-muted p-0.5" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="rounded-sm text-xs text-muted-foreground underline-offset-4 transition-colors outline-none select-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/30"
                  >
                    清除全部
                  </button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>时间</TableHead>
                  <TableHead>操作者</TableHead>
                  <TableHead>动作</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>详情</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatTime(log.createdAt)}
                    </TableCell>
                    <TableCell>{log.username || "未知"}</TableCell>
                    <TableCell className="font-mono text-xs">{log.action}</TableCell>
                    <TableCell className="text-muted-foreground">{log.ip || "-"}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="max-w-[240px] truncate text-muted-foreground">
                      {log.detail || "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {!tableLoading && logs.length === 0 && (
                  <TableEmptyRow
                    colSpan={6}
                    text={
                      activeFilters.length > 0
                        ? "没有符合条件的记录，试着放宽筛选条件"
                        : "暂无审计记录，系统的写操作和权限拦截会自动记录在这里"
                    }
                  />
                )}
              </TableBody>
            </Table>

            <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}