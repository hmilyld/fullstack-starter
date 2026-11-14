import * as React from "react"
import { useTranslation } from "react-i18next"
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

import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { InlineError } from "@/components/shared/inline-error"
import { PageHeader } from "@/components/shared/page-header"
import { TrendChart } from "@/components/shared/trend-chart"
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
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import type { AuditLog } from "@/types/audit-log"
import type { ActivityItem, DashboardStats } from "@/types/dashboard"

const QUICK_LINKS = [
  {
    href: "/settings/user",
    labelKey: "dashboard.links.users.label",
    descriptionKey: "dashboard.links.users.description",
    icon: UsersIcon,
    permission: "users",
  },
  {
    href: "/settings/role",
    labelKey: "dashboard.links.roles.label",
    descriptionKey: "dashboard.links.roles.description",
    icon: ShieldCheckIcon,
    permission: "roles",
  },
  {
    href: "/settings/audit-log",
    labelKey: "dashboard.links.audit.label",
    descriptionKey: "dashboard.links.audit.description",
    icon: FileTextIcon,
    permission: "audit_logs",
  },
  {
    href: "/settings/data",
    labelKey: "dashboard.links.data.label",
    descriptionKey: "dashboard.links.data.description",
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
  const { t, i18n } = useTranslation()
  const { hasPermission } = useAuth()
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
      setError(
        statsRes.message || activityRes.message || t("dashboard.loadFailed")
      )
    }
    setLoading(false)
    setTrendLoading(false)
  }, [canReadAudit, t])

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
          title: t("dashboard.stats.totalUsers"),
          value: new Intl.NumberFormat(i18n.resolvedLanguage).format(
            stats.totalUsers
          ),
          hint: t("dashboard.stats.allAccounts"),
          icon: UsersIcon,
          demo: false,
        },
        {
          title: t("dashboard.stats.activeNow"),
          value: new Intl.NumberFormat(i18n.resolvedLanguage).format(
            stats.activeNow
          ),
          hint: t("dashboard.stats.recentSessions"),
          icon: ActivityIcon,
          demo: true,
        },
        {
          title: t("dashboard.stats.revenue"),
          value: stats.revenue,
          hint: t("dashboard.stats.monthTotal"),
          icon: DollarSignIcon,
          demo: true,
        },
        {
          title: t("dashboard.stats.growth"),
          value: stats.growth,
          hint: t("dashboard.stats.vsLastMonth"),
          icon: TrendingUpIcon,
          demo: true,
        },
      ]
    : []

  const quickLinks = QUICK_LINKS.filter((link) =>
    hasPermission(link.permission)
  ).map((link) => ({
    ...link,
    label: t(link.labelKey),
    description: t(link.descriptionKey),
  }))

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.description")}
        actions={
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCwIcon data-icon="inline-start" />
            {t("dashboard.refresh")}
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
                            {t("dashboard.demoData")}
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
                  <CardTitle>{t("dashboard.trendTitle")}</CardTitle>
                  <CardDescription>
                    {canReadAudit
                      ? t("dashboard.trendDescription", { count: weekTotal })
                      : t("dashboard.trendDescriptionNoAudit")}
                  </CardDescription>
                </div>
                {canReadAudit && weekTotal > 0 && (
                  <div className="flex shrink-0 items-center gap-3 pt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-chart-1" />
                      {t("dashboard.trendSuccess", { count: weekSuccess })}
                    </span>
                    {weekFailed > 0 && (
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-destructive" />
                        {t("dashboard.trendFailed", { count: weekFailed })}
                      </span>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="h-[280px]">
                {!canReadAudit ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 text-center">
                    <ShieldCheckIcon className="size-5 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {t("dashboard.noAuditTitle")}
                    </p>
                    <p className="max-w-xs text-xs text-muted-foreground">
                      {t("dashboard.noAuditDescription")}
                    </p>
                  </div>
                ) : trendLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : weekTotal === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 text-center">
                    <ActivityIcon className="size-5 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {t("dashboard.emptyTrendTitle")}
                    </p>
                    <p className="max-w-xs text-xs text-muted-foreground">
                      {t("dashboard.emptyTrendDescription")}
                    </p>
                  </div>
                ) : (
                  <TrendChart points={trend} />
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>{t("dashboard.recentTitle")}</CardTitle>
                <CardDescription>
                  {t("dashboard.recentDescription")}
                </CardDescription>
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
                    title={t("dashboard.emptyRecentTitle")}
                    description={t("dashboard.emptyRecentDescription")}
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
                  {t("dashboard.viewAll")}
                  <ArrowRightIcon className="size-4" />
                </Link>
              </CardFooter>
            </Card>
          </div>

          {quickLinks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.quickTitle")}</CardTitle>
                <CardDescription>
                  {t("dashboard.quickDescription")}
                </CardDescription>
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
            {t("dashboard.placeholderNote")}
          </p>
        </>
      )}
    </div>
  )
}
