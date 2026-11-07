import * as React from "react"
import { Link } from "react-router"
import {
  ActivityIcon,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getDashboardActivity, getDashboardStats } from "@/api/dashboard"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
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

export function DashboardPage() {
  const { hasPermission } = useAuth()
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [activity, setActivity] = React.useState<ActivityItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    const [statsRes, activityRes] = await Promise.all([
      getDashboardStats(),
      getDashboardActivity(),
    ])
    if (statsRes.code === 0) setStats(statsRes.data)
    if (activityRes.code === 0) setActivity(activityRes.data)
    if (statsRes.code !== 0 || activityRes.code !== 0) {
      setError(statsRes.message || activityRes.message || "加载数据失败")
    }
    setLoading(false)
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  const statItems = stats
    ? [
        { title: "总用户数", value: String(stats.totalUsers), icon: UsersIcon },
        {
          title: "当前活跃",
          value: String(stats.activeNow),
          icon: ActivityIcon,
        },
        { title: "收入", value: stats.revenue, icon: DollarSignIcon },
        { title: "增长率", value: stats.growth, icon: TrendingUpIcon },
      ]
    : []

  const quickLinks = QUICK_LINKS.filter((link) =>
    hasPermission(link.permission)
  )

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <PageHeader
        title="仪表盘"
        description="欢迎回来，以下是系统概览。"
        actions={
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCwIcon data-icon="inline-start" />
            刷新
          </Button>
        }
      />

      <Alert>
        <InfoIcon />
        <AlertTitle>演示数据</AlertTitle>
        <AlertDescription>
          “当前活跃”“收入”“增长率”和“最近动态”由后端占位接口返回，接入真实业务统计后请替换。
        </AlertDescription>
      </Alert>

      {error && stats && <InlineError message={error} onRetry={load} />}

      {error && !stats ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="size-4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-24" />
                    </CardContent>
                  </Card>
                ))
              : statItems.map((stat) => (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        {stat.title}
                      </CardTitle>
                      <stat.icon className="text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold tabular-nums">
                        {stat.value}
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>

          <div
            className={cn(
              "grid gap-4",
              quickLinks.length > 0 && "md:grid-cols-2"
            )}
          >
            <Card>
              <CardHeader>
                <CardTitle>最近动态</CardTitle>
                <CardDescription>工作区中的最新操作记录。</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex flex-col gap-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex flex-col gap-1">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-3 w-32" />
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
                  />
                ) : (
                  <div className="flex flex-col gap-4">
                    {activity.map((item, index) => (
                      <div
                        key={`${item.user}-${index}`}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-medium">
                            {item.user}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {item.action}
                          </span>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {item.time}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {quickLinks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>快捷入口</CardTitle>
                  <CardDescription>只显示您有权限访问的页面。</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    {quickLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        className="flex items-center gap-3 rounded-xl border p-3 transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30"
                      >
                        <link.icon className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">
                            {link.label}
                          </div>
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
          </div>
        </>
      )}
    </div>
  )
}
