<script lang="ts">
  /* eslint-disable svelte/prefer-svelte-reactivity -- Set/Map/Date 只用于不可变副本或纯计算，不承载响应式状态 */
  import { onMount } from "svelte"
  import { resolve } from "$app/paths"
  import {
    Activity,
    ArrowRight,
    ChevronRight,
    Database,
    DollarSign,
    FileText,
    Info,
    RefreshCw,
    ShieldCheck,
    TrendingUp,
    Users,
  } from "@lucide/svelte"
  import EmptyState from "#lib/components/shared/empty-state.svelte"
  import ErrorState from "#lib/components/shared/error-state.svelte"
  import InlineError from "#lib/components/shared/inline-error.svelte"
  import PageHeader from "#lib/components/shared/page-header.svelte"
  import TrendChart from "#lib/components/shared/trend-chart.svelte"
  import { Avatar, AvatarFallback } from "#lib/components/ui/avatar/index.js"
  import { Badge } from "#lib/components/ui/badge/index.js"
  import { Button } from "#lib/components/ui/button/index.js"
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "#lib/components/ui/card/index.js"
  import { Skeleton } from "#lib/components/ui/skeleton/index.js"
  import { getAuditLogs } from "#lib/api/audit-log.js"
  import {
    getDashboardActivity,
    getDashboardStats,
  } from "#lib/api/dashboard.js"
  import { locale, t } from "#lib/i18n.js"
  import { auth } from "#lib/stores/auth.svelte.js"
  import { cn } from "#lib/utils.js"
  import type { AuditLog } from "#lib/types/audit-log.js"
  import type { ActivityItem, DashboardStats } from "#lib/types/dashboard.js"

  const QUICK_LINKS = [
    {
      href: "/settings/user",
      labelKey: "dashboard.links.users.label",
      descriptionKey: "dashboard.links.users.description",
      icon: Users,
      permission: "users",
    },
    {
      href: "/settings/role",
      labelKey: "dashboard.links.roles.label",
      descriptionKey: "dashboard.links.roles.description",
      icon: ShieldCheck,
      permission: "roles",
    },
    {
      href: "/settings/audit-log",
      labelKey: "dashboard.links.audit.label",
      descriptionKey: "dashboard.links.audit.description",
      icon: FileText,
      permission: "audit_logs",
    },
    {
      href: "/settings/data",
      labelKey: "dashboard.links.data.label",
      descriptionKey: "dashboard.links.data.description",
      icon: Database,
      permission: "data_management.export",
    },
  ]

  type TrendPoint = {
    label: string
    success: number
    failed: number
    total: number
  }

  let stats = $state<DashboardStats | null>(null)
  let activity = $state<ActivityItem[]>([])
  let logs = $state<AuditLog[]>([])
  let loading = $state(true)
  let trendLoading = $state(true)
  let error = $state<string | null>(null)

  const canReadAudit = $derived(auth.hasPermission("audit_logs"))

  function startOfDay(date: Date) {
    const next = new Date(date)
    next.setHours(0, 0, 0, 0)
    return next
  }

  function toLocalInput(date: Date) {
    const pad = (value: number) => String(value).padStart(2, "0")
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  function trendLabel(day: Date, locale: string) {
    if (locale === "zh-CN") return `${day.getMonth() + 1}/${day.getDate()}`
    return new Intl.DateTimeFormat(locale, {
      month: "numeric",
      day: "numeric",
    }).format(day)
  }

  function buildTrend(records: AuditLog[], locale: string): TrendPoint[] {
    const today = startOfDay(new Date())
    const days = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(today)
      day.setDate(today.getDate() - (6 - index))
      return day
    })

    const points = days.map((day) => ({
      label: trendLabel(day, locale),
      success: 0,
      failed: 0,
      total: 0,
    }))

    for (const log of records) {
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

  const trend = $derived(buildTrend(logs, $locale))
  const weekTotal = $derived(trend.reduce((sum, point) => sum + point.total, 0))
  const weekSuccess = $derived(
    trend.reduce((sum, point) => sum + point.success, 0)
  )
  const weekFailed = $derived(
    trend.reduce((sum, point) => sum + point.failed, 0)
  )

  const statsNumber = $derived(new Intl.NumberFormat($locale))

  const statItems = $derived.by(() => {
    if (!stats) return []
    return [
      {
        title: $t("dashboard.stats.totalUsers"),
        value: statsNumber.format(stats.totalUsers),
        hint: $t("dashboard.stats.allAccounts"),
        icon: Users,
        demo: false,
      },
      {
        title: $t("dashboard.stats.activeNow"),
        value: statsNumber.format(stats.activeNow),
        hint: $t("dashboard.stats.recentSessions"),
        icon: Activity,
        demo: true,
      },
      {
        title: $t("dashboard.stats.revenue"),
        value: stats.revenue,
        hint: $t("dashboard.stats.monthTotal"),
        icon: DollarSign,
        demo: true,
      },
      {
        title: $t("dashboard.stats.growth"),
        value: stats.growth,
        hint: $t("dashboard.stats.vsLastMonth"),
        icon: TrendingUp,
        demo: true,
      },
    ]
  })

  const quickLinks = $derived(
    QUICK_LINKS.filter((link) => auth.hasPermission(link.permission)).map(
      (link) => ({
        ...link,
        label: $t(link.labelKey),
        description: $t(link.descriptionKey),
      })
    )
  )

  async function load() {
    loading = true
    error = null

    const firstDay = startOfDay(new Date())
    firstDay.setDate(firstDay.getDate() - 6)

    const [statsRes, activityRes, auditRes] = await Promise.all([
      getDashboardStats(),
      getDashboardActivity(),
      canReadAudit
        ? getAuditLogs({ startTime: toLocalInput(firstDay), pageSize: 500 })
        : Promise.resolve(null),
    ])

    if (statsRes.code === 0) stats = statsRes.data
    if (activityRes.code === 0) activity = activityRes.data
    if (auditRes && auditRes.code === 0) logs = auditRes.data.list
    if (statsRes.code !== 0 || activityRes.code !== 0) {
      error =
        statsRes.message || activityRes.message || $t("dashboard.loadFailed")
    }
    loading = false
    trendLoading = false
  }

  onMount(() => {
    void load()
  })
</script>

<svelte:head
  ><title>{$t("dashboard.title")} · {$t("pwa.defaultName")}</title></svelte:head
>

<div class="flex flex-col gap-(--page-gap)">
  <PageHeader
    title={$t("dashboard.title")}
    description={$t("dashboard.description")}
  >
    <Button variant="outline" disabled={loading} onclick={() => void load()}>
      <RefreshCw data-icon="inline-start" />
      {$t("dashboard.refresh")}
    </Button>
  </PageHeader>

  {#if error && stats}
    <InlineError message={error} onRetry={() => void load()} />
  {/if}

  {#if error && !stats}
    <ErrorState message={error} onRetry={() => void load()} />
  {:else}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {#if loading}
        {#each Array(4) as _, index (index)}
          <Card class="gap-2">
            <CardHeader class="flex flex-row items-center justify-between">
              <Skeleton class="h-4 w-20" />
              <Skeleton class="size-8 rounded-lg" />
            </CardHeader>
            <CardContent class="flex flex-col gap-2">
              <Skeleton class="h-8 w-24" />
              <Skeleton class="h-3 w-16" />
            </CardContent>
          </Card>
        {/each}
      {:else}
        {#each statItems as stat (stat.title)}
          {@const Icon = stat.icon}
          <Card class="gap-2">
            <CardHeader
              class="flex flex-row items-center justify-between gap-2 pb-0"
            >
              <CardTitle class="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon class="size-4 shrink-0 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                class="font-heading text-3xl font-semibold tracking-tight tabular-nums"
              >
                {stat.value}
              </div>
              <div
                class="mt-1 flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span>{stat.hint}</span>
                {#if stat.demo}
                  <Badge
                    variant="outline"
                    class="h-4 px-1.5 text-[10px] font-normal"
                  >
                    {$t("dashboard.demoData")}
                  </Badge>
                {/if}
              </div>
            </CardContent>
          </Card>
        {/each}
      {/if}
    </div>

    <div class="grid gap-4 lg:grid-cols-7">
      <Card class="lg:col-span-4">
        <CardHeader class="flex flex-row items-start justify-between gap-4">
          <div class="grid gap-1.5">
            <CardTitle>{$t("dashboard.trendTitle")}</CardTitle>
            <CardDescription>
              {canReadAudit
                ? $t("dashboard.trendDescription", { count: weekTotal })
                : $t("dashboard.trendDescriptionNoAudit")}
            </CardDescription>
          </div>
          {#if canReadAudit && weekTotal > 0}
            <div
              class="flex shrink-0 items-center gap-3 pt-1 text-xs text-muted-foreground"
            >
              <span class="flex items-center gap-1.5">
                <span class="size-2 rounded-full bg-chart-1"></span>
                {$t("dashboard.trendSuccess", { count: weekSuccess })}
              </span>
              {#if weekFailed > 0}
                <span class="flex items-center gap-1.5">
                  <span class="size-2 rounded-full bg-destructive"></span>
                  {$t("dashboard.trendFailed", { count: weekFailed })}
                </span>
              {/if}
            </div>
          {/if}
        </CardHeader>
        <CardContent class="h-[280px]">
          {#if !canReadAudit}
            <div
              class="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 text-center"
            >
              <ShieldCheck class="size-5 text-muted-foreground" />
              <p class="text-sm font-medium">
                {$t("dashboard.noAuditTitle")}
              </p>
              <p class="max-w-xs text-xs text-muted-foreground">
                {$t("dashboard.noAuditDescription")}
              </p>
            </div>
          {:else if trendLoading}
            <Skeleton class="h-full w-full" />
          {:else if weekTotal === 0}
            <div
              class="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 text-center"
            >
              <Activity class="size-5 text-muted-foreground" />
              <p class="text-sm font-medium">
                {$t("dashboard.emptyTrendTitle")}
              </p>
              <p class="max-w-xs text-xs text-muted-foreground">
                {$t("dashboard.emptyTrendDescription")}
              </p>
            </div>
          {:else}
            <TrendChart points={trend} />
          {/if}
        </CardContent>
      </Card>

      <Card class="lg:col-span-3">
        <CardHeader>
          <CardTitle>{$t("dashboard.recentTitle")}</CardTitle>
          <CardDescription>{$t("dashboard.recentDescription")}</CardDescription>
        </CardHeader>
        <CardContent class="flex-1">
          {#if loading}
            <div class="flex flex-col gap-4">
              {#each Array(5) as _, index (index)}
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <Skeleton class="size-8 rounded-full" />
                    <div class="flex flex-col gap-1">
                      <Skeleton class="h-3.5 w-16" />
                      <Skeleton class="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton class="h-3 w-16" />
                </div>
              {/each}
            </div>
          {:else if activity.length === 0}
            <EmptyState
              icon={Activity}
              title={$t("dashboard.emptyRecentTitle")}
              description={$t("dashboard.emptyRecentDescription")}
              class="border-0 py-8"
            />
          {:else}
            <div class="flex flex-col gap-4">
              {#each activity as item, index (`${item.user}-${index}`)}
                <div class="flex items-center gap-3">
                  <Avatar class="size-8">
                    <AvatarFallback class="text-xs">
                      {item.user.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div class="flex min-w-0 flex-1 flex-col">
                    <span class="truncate text-sm font-medium">
                      {item.user}
                    </span>
                    <span class="truncate text-xs text-muted-foreground">
                      {item.action}
                    </span>
                  </div>
                  <span
                    class="shrink-0 text-xs text-muted-foreground tabular-nums"
                  >
                    {item.time}
                  </span>
                </div>
              {/each}
            </div>
          {/if}
        </CardContent>
        <CardFooter class="mt-auto border-t pt-4">
          <a
            href={resolve("settings/audit-log")}
            class="flex w-full items-center justify-between gap-2 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            {$t("dashboard.viewAll")}
            <ArrowRight class="size-4" />
          </a>
        </CardFooter>
      </Card>
    </div>

    {#if quickLinks.length > 0}
      <Card>
        <CardHeader>
          <CardTitle>{$t("dashboard.quickTitle")}</CardTitle>
          <CardDescription>{$t("dashboard.quickDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid gap-2 sm:grid-cols-2">
            {#each quickLinks as link (link.href)}
              {@const Icon = link.icon}
              <!-- eslint-disable svelte/no-navigation-without-resolve -- 快捷入口路由来自权限数据 -->
              <a
                href={link.href}
                class={cn(
                  "flex items-center gap-3 rounded-lg border p-3 transition-colors outline-none",
                  "hover:border-ring/40 hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring"
                )}
              >
                <span
                  class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                >
                  <Icon class="size-4" />
                </span>
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium">{link.label}</div>
                  <div class="truncate text-xs text-muted-foreground">
                    {link.description}
                  </div>
                </div>
                <ChevronRight class="size-4 shrink-0 text-muted-foreground" />
              </a>
              <!-- eslint-enable svelte/no-navigation-without-resolve -->
            {/each}
          </div>
        </CardContent>
      </Card>
    {/if}

    <p class="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Info class="size-3.5 shrink-0" />
      {$t("dashboard.placeholderNote")}
    </p>
  {/if}
</div>
