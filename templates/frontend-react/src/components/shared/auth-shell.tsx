import type { ReactNode } from "react"

import { BrandMark } from "@/components/brand-mark"
import { useSiteConfig } from "@/lib/site-config"

/** 登录/注册页共用的居中布局与品牌区 */
export function AuthShell({ children }: { children: ReactNode }) {
  const { config } = useSiteConfig()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-(--layout-gutter) py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="flex flex-col items-center gap-2 text-center">
        <BrandMark className="size-10" />
        <div className="flex flex-col gap-1">
          <span className="text-xl font-semibold tracking-tight">
            {config?.siteName || "管理系统"}
          </span>
          <span className="text-sm text-muted-foreground">
            {config?.siteDescription || "登录后管理用户、角色与系统设置"}
          </span>
        </div>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
