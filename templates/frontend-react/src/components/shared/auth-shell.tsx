import type { ReactNode } from "react"
import { DatabaseIcon, ScrollTextIcon, ShieldCheckIcon } from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { useSiteConfig } from "@/lib/site-config"

const highlights = [
  { icon: ShieldCheckIcon, label: "细粒度权限" },
  { icon: ScrollTextIcon, label: "操作审计" },
  { icon: DatabaseIcon, label: "数据导入导出" },
]

/** 登录/注册页共用的分栏布局：品牌说明 + 表单 */
export function AuthShell({ children }: { children: ReactNode }) {
  const { config } = useSiteConfig()
  const siteName = config?.siteName || "管理系统"
  const siteDescription =
    config?.siteDescription || "登录后管理用户、角色与系统设置"

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-(--layout-gutter) py-6 pb-[max(2rem,env(safe-area-inset-bottom))] md:py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl border bg-card shadow-xl max-lg:rounded-none max-lg:border-0 max-lg:bg-transparent max-lg:shadow-none max-lg:ring-0 lg:grid-cols-[1.08fr_1fr]">
        <aside className="relative hidden flex-col justify-between gap-10 bg-primary p-10 text-primary-foreground lg:flex xl:p-14 dark:border-border dark:bg-background dark:text-foreground dark:lg:border-r">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-card shadow-sm">
              <BrandMark className="size-8" />
            </div>
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-base font-semibold">{siteName}</p>
              <p className="line-clamp-2 text-sm text-primary-foreground/60 dark:text-muted-foreground">
                {siteDescription}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-3xl leading-[1.15] font-semibold tracking-tight text-balance xl:text-4xl">
              把用户、权限与数据，
              <br />
              收进一个工作台。
            </p>
            <p className="max-w-md text-sm leading-relaxed text-primary-foreground/60 dark:text-muted-foreground">
              用户、角色、菜单权限、审计与数据管理，共用同一套权限模型。
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-primary-foreground/60 dark:text-muted-foreground">
            {highlights.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <Icon className="size-3.5" />
                {label}
              </span>
            ))}
          </div>
        </aside>

        <section className="flex flex-col justify-center p-5 py-8 sm:p-8 lg:p-12">
          <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
            <div className="flex items-center gap-3 lg:hidden">
              <BrandMark className="size-9" />
              <div className="flex min-w-0 flex-col">
                <p className="truncate text-sm font-semibold">{siteName}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {siteDescription}
                </p>
              </div>
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  )
}
