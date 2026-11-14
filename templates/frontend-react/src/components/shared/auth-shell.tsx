import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  DatabaseIcon,
  MonitorSmartphoneIcon,
  ScrollTextIcon,
  ShieldCheckIcon,
} from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useSiteConfig } from "@/lib/site-config"

const capabilities = [
  { icon: ShieldCheckIcon, key: "rbac" },
  { icon: ScrollTextIcon, key: "audit" },
  { icon: DatabaseIcon, key: "data" },
  { icon: MonitorSmartphoneIcon, key: "responsive" },
] as const

/** 登录/注册页共用的分栏布局：品牌说明 + 表单 */
export function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { config } = useSiteConfig()
  const siteName = config?.siteName || t("authShell.fallbackName")
  const siteDescription =
    config?.siteDescription || t("authShell.fallbackDescription")

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-(--layout-gutter) py-6 pb-[max(2rem,env(safe-area-inset-bottom))] md:py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl border bg-card shadow-xl max-lg:rounded-none max-lg:border-0 max-lg:bg-transparent max-lg:shadow-none max-lg:ring-0 lg:grid-cols-[1.08fr_1fr]">
        <aside className="relative hidden flex-col justify-between gap-10 overflow-hidden bg-primary p-10 text-primary-foreground lg:flex xl:p-14 dark:border-border dark:bg-background dark:text-foreground dark:lg:border-r">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent"
          />
          <div className="relative flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-card shadow-sm ring-1 ring-primary-foreground/10 dark:ring-border">
              <BrandMark className="size-8" />
            </div>
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-base font-semibold">{siteName}</p>
              <p className="line-clamp-2 text-sm text-primary-foreground/60 dark:text-muted-foreground">
                {siteDescription}
              </p>
            </div>
          </div>

          <div className="relative flex flex-col gap-4">
            <p className="text-3xl leading-[1.15] font-semibold tracking-tight text-balance xl:text-4xl">
              {t("authShell.headlineLine1")}
              <br />
              {t("authShell.headlineLine2")}
            </p>
            <p className="max-w-md text-sm leading-relaxed text-primary-foreground/60 dark:text-muted-foreground">
              {t("authShell.subtitle")}
            </p>
          </div>

          <div className="relative grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-primary-foreground/10 bg-primary-foreground/10 dark:border-border dark:bg-border">
            {capabilities.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="flex items-start gap-2.5 bg-primary p-3.5 dark:bg-background"
              >
                <Icon className="mt-0.5 size-4 shrink-0 opacity-70" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {t(`authShell.capabilities.${key}.label`)}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed opacity-60">
                    {t(`authShell.capabilities.${key}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="flex flex-col justify-center p-5 py-8 sm:p-8 lg:p-12">
          <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3 lg:hidden">
                <BrandMark className="size-9" />
                <div className="flex min-w-0 flex-col">
                  <p className="truncate text-sm font-semibold">{siteName}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {siteDescription}
                  </p>
                </div>
              </div>
              <div className="ml-auto">
                <LanguageSwitcher />
              </div>
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  )
}
