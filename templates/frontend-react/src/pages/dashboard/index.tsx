import * as React from "react"
import { Link } from "react-router"
import {
  ActivityIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  DatabaseIcon,
  DollarSignIcon,
  FileTextIcon,
  InfoIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { InlineError } from "@/components/shared/inline-error"
import { PageHeader } from "@/components/shared/page-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getAuditLogs } from "@/api/audit-log"
import { getDashboardActivity, getDashboardStats } from "@/api/dashboard"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import type { AuditLog } from "@/types/audit-log"
import type { ActivityItem, DashboardStats } from "@/types/dashboard"

const QUICK_LINKS = [
  {
    href: "/settings/user",
    label: "用户管理",
    description: "维护团队成员及其角色",
    icon: UsersIcon,
    permission: "users",
  },
  {
    href: "/settings/role",
    label: "角色管理",
    description: "分配角色与权限",
    icon: ShieldCheckIcon,
    permission: "roles",
  },
  {
    href: "/settings/audit-log",
    label: "审计日志",
    description: "查看写操作与权限拦截",
    icon: FileTextIcon,
    permission: "audit_logs",
  },
  {
    href: "/settings/data",
    label: "数据管理",
    description: "导出或恢复系统数据",
    icon: DatabaseIcon,
    permission: "data_management.export",
  },
]

type TrendPoint = {
  label: string
  success: number
  failed: number
  total: number
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function toLocalInput(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function buildTrend(logs: AuditLog[]): TrendPoint[] {
  const today = startOfDay(new Date())
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today)
    day.setDate(today.getDate() - (6 - index))
    return day
  })

  const points = days.map((day) => ({
    label: `${day.getMonth() + 1}/${day.getDate()}`,
    success: 0,
    failed: 0,
    total: 0,
  }))

  for (const log of logs) {
    const created = new Date(log.createdAt)
    if (Number.isNaN(created.getTime())) continue
    const index = days.findIndex(
      (day) => day.getTime() === startOfDay(created).getTime()
    )
    if (index < 0) continue
    points[index].total += 1
    if (log.status === "success") points[index].success += 1
    else points[index].failed += 1
  }

  return points
}

export function DashboardPage() {
  const { hasPermission } = useAuth()
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [activity, setActivity] = React.useState<ActivityItem[]>([])
  const [logs, setLogs] = React.useState<AuditLog[]>([])
  const [loading, setLoading] = React.useState(true)
  const [trendLoading, setTrendLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const canReadAudit = hasPermission("audit_logs")

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    const firstDay = startOfDay(new Date())
    firstDay.setDate(firstDay.getDate() - 6)

    const [statsRes, activityRes, auditRes] = await Promise.all([
      getDashboardStats(),
      getDashboardActivity(),
      canReadAudit
        ? getAuditLogs({ startTime: toLocalInput(firstDay), pageSize: 500 })
        : Promise.resolve(null),
    ])

    if (statsRes.code === 0) setStats(statsRes.data)
    if (activityRes.code === 0) setActivity(activityRes.data)
    if (auditRes && auditRes.code === 0) setLogs(auditRes.data.list)
    if (statsRes.code !== 0 || activityRes.code !== 0) {
      setError(statsRes.message || activityRes.message || "加载数据失败")
    }
    setLoading(false)
    setTrendLoading(false)
  }, [canReadAudit])

  React.useEffect(() => {
    void load()
  }, [load])

  const trend = React.useMemo(() => buildTrend(logs), [logs])
  const weekTotal = trend.reduce((sum, point) => sum + point.total, 0)
  const weekSuccess = trend.reduce((sum, point) => sum + point.success, 0)
  const weekFailed = trend.reduce((sum, point) => sum + point.failed, 0)

  const statItems = stats
    ? [
        {
          title: "总用户数",
          value: new Intl.NumberFormat("zh-CN").format(stats.totalUsers),
          hint: "全部账号",
          icon: UsersIcon,
          demo: false,
        },
        {
          title: "当前活跃",
          value: new Intl.NumberFormat("zh-CN").format(stats.activeNow),
          hint: "最近活跃会话",
          icon: ActivityIcon,
          demo: true,
        },
        {
          title: "收入",
          value: stats.revenue,
          hint: "本月累计",
          icon: DollarSignIcon,
          demo: true,
        },
        {
          title: "增长率",
          value: stats.growth,
          hint: "较上月",
          icon: TrendingUpIcon,
          demo: true,
        },
      ]
    : []

  const quickLinks = QUICK_LINKS.filter((link) =>
    hasPermission(link.permission)
  )

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <PageHeader
        title="仪表盘"
        description="系统概览：账号规模、活跃度与最近操作。"
        actions={
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCwIcon data-icon="inline-start" />
            刷新
          </Button>
        }
      />

      {error && stats && <InlineError message={error} onRetry={load} />}

      {error && !stats ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} className="gap-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="size-8 rounded-lg" />
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </CardContent>
                  </Card>
                ))
              : statItems.map((stat) => (
                  <Card key={stat.title} className="gap-2">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <stat.icon className="size-4 shrink-0 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="font-heading text-3xl font-semibold tracking-tight tabular-nums">
                        {stat.value}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{stat.hint}</span>
                        {stat.demo && (
                          <Badge
                            variant="outline"
                            className="h-4 px-1.5 text-[10px] font-normal"
                          >
                            演示数据
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="grid gap-1.5">
                  <CardTitle>近 7 天操作趋势</CardTitle>
                  <CardDescription>
                    {canReadAudit
                      ? `共 ${weekTotal} 次写操作，按天统计。`
                      : "按天统计审计日志中的写操作，用于判断系统活跃度。"}
                  </CardDescription>
                </div>
                {canReadAudit && weekTotal > 0 && (
                  <div className="flex shrink-0 items-center gap-3 pt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-chart-1" />
                      成功 {weekSuccess}
                    </span>
                    {weekFailed > 0 && (
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-destructive" />
                        失败 {weekFailed}
                      </span>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="h-[280px]">
                {!canReadAudit ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 text-center">
                    <ShieldCheckIcon className="size-5 text-muted-foreground" />
                    <p className="text-sm font-medium">趋势需要审计权限</p>
                    <p className="max-w-xs text-xs text-muted-foreground">
                      当前账号没有「审计日志」权限，无法读取操作记录。联系管理员为该角色授予权限后即可查看。
                    </p>
                  </div>
                ) : trendLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : weekTotal === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 text-center">
                    <ActivityIcon className="size-5 text-muted-foreground" />
                    <p className="text-sm font-medium">最近 7 天没有写操作</p>
                    <p className="max-w-xs text-xs text-muted-foreground">
                      用户新增、修改、删除等操作会出现在这里。
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trend}
                      margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
                    >
                      <defs>
                        <linearGradient
                          id="trend-fill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="var(--chart-1)"
                            stopOpacity={0.28}
                          />
                          <stop
                            offset="100%"
                            stopColor="var(--chart-1)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        vertical={false}
                        stroke="var(--border)"
                        strokeDasharray="3 3"
                      />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={44}
                        allowDecimals={false}
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                      />
                      <Tooltip
                        cursor={{ stroke: "var(--border)" }}
                        contentStyle={{
                          backgroundColor: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                          color: "var(--popover-foreground)",
                          fontSize: 12,
                          boxShadow: "0 8px 24px rgb(15 23 42 / 0.10)",
                        }}
                        labelStyle={{ color: "var(--muted-foreground)" }}
                        formatter={(value, name) => [
                          `${Number(value ?? 0)} 次`,
                          name === "success" ? "成功" : "失败或被拦截",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="success"
                        name="success"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        fill="url(#trend-fill)"
                        isAnimationActive={!prefersReducedMotion}
                      />
                      {weekFailed > 0 && (
                        <Area
                          type="monotone"
                          dataKey="failed"
                          name="failed"
                          stroke="var(--destructive)"
                          strokeWidth={2}
                          fill="transparent"
                          isAnimationActive={!prefersReducedMotion}
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>最近动态</CardTitle>
                <CardDescription>工作区中的最新操作记录。</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {loading ? (
                  <div className="flex flex-col gap-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-8 rounded-full" />
                          <div className="flex flex-col gap-1">
                            <Skeleton className="h-3.5 w-16" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                        <Skeleton className="h-3 w-16" />
                      </div>
                    ))}
                  </div>
                ) : activity.length === 0 ? (
                  <EmptyState
                    icon={ActivityIcon}
                    title="暂无动态"
                    description="系统产生操作记录后会显示在这里。"
                    className="border-0 py-8"
                  />
                ) : (
                  <div className="flex flex-col gap-4">
                    {activity.map((item, index) => (
                      <div
                        key={`${item.user}-${index}`}
                        className="flex items-center gap-3"
                      >
                        <Avatar className="size-8">
                          <AvatarImage alt={item.user} />
                          <AvatarFallback className="text-xs">
                            {item.user.slice(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium">
                            {item.user}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {item.action}
                          </span>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {item.time}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="mt-auto border-t pt-4">
                <Link
                  to="/settings/audit-log"
                  className="flex w-full items-center justify-between gap-2 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring"
                >
                  查看全部审计日志
                  <ArrowRightIcon className="size-4" />
                </Link>
              </CardFooter>
            </Card>
          </div>

          {quickLinks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>快捷入口</CardTitle>
                <CardDescription>只显示您有权限访问的页面。</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {quickLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 transition-colors outline-none",
                        "hover:border-ring/40 hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring"
                      )}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <link.icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{link.label}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {link.description}
                        </div>
                      </div>
                      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <InfoIcon className="size-3.5 shrink-0" />
            “当前活跃”“收入”“增长率”与“最近动态”来自后端的占位接口，接入真实统计后请替换。
          </p>
        </>
      )}
    </div>
  )
}
