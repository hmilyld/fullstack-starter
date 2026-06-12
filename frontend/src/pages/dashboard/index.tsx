import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { UsersIcon, ActivityIcon, DollarSignIcon, TrendingUpIcon } from "lucide-react"
import { getDashboardStats, getDashboardActivity } from "@/lib/api"
import type { DashboardStats, ActivityItem } from "@/types/api"

export function DashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [activity, setActivity] = React.useState<ActivityItem[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      const [statsRes, activityRes] = await Promise.all([
        getDashboardStats(),
        getDashboardActivity(),
      ])
      if (statsRes.code === 0) setStats(statsRes.data)
      if (activityRes.code === 0) setActivity(activityRes.data)
      setLoading(false)
    }
    load()
  }, [])

  const statItems = stats
    ? [
        { title: "总用户数", value: String(stats.totalUsers), change: "+20.1%", icon: UsersIcon, description: "较上月" },
        { title: "当前活跃", value: String(stats.activeNow), change: "+12.2%", icon: ActivityIcon, description: "较上小时" },
        { title: "收入", value: stats.revenue, change: "+15.3%", icon: DollarSignIcon, description: "较上月" },
        { title: "增长率", value: stats.growth, change: "+4.5%", icon: TrendingUpIcon, description: "较上季度" },
      ]
    : []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">仪表盘</h1>
        <p className="text-muted-foreground">
          欢迎回来，以下是您的项目概览。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="size-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="mb-2 h-8 w-24" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))
          : statItems.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    <Badge variant="secondary" className="mr-1">
                      {stat.change}
                    </Badge>
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>最近动态</CardTitle>
            <CardDescription>工作区中的最新操作记录。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))
                : activity.map((item) => (
                    <div key={item.user} className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.user}</span>
                        <span className="text-xs text-muted-foreground">{item.action}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>快捷操作</CardTitle>
            <CardDescription>常用的操作入口。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {[
                { label: "创建项目", desc: "开始一个新的工作空间" },
                { label: "邀请团队", desc: "添加协作者" },
                { label: "查看报表", desc: "数据分析与洞察" },
                { label: "管理账单", desc: "更新支付方式" },
              ].map((action) => (
                <div
                  key={action.label}
                  className="flex cursor-pointer items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted"
                >
                  <div>
                    <div className="text-sm font-medium">{action.label}</div>
                    <div className="text-xs text-muted-foreground">{action.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
