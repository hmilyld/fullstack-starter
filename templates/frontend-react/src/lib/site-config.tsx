import * as React from "react"
import { useTranslation } from "react-i18next"
import { getPublicConfig } from "@/api/system"
import type { PublicConfig } from "@/types/system"
import { Skeleton } from "@/components/ui/skeleton"
import { applySiteDefaultLocale } from "@/lib/i18n"

type SiteConfigContextType = {
  config: PublicConfig | null
  loading: boolean
  refresh: () => Promise<void>
}

const SiteConfigContext = React.createContext<SiteConfigContextType | null>(
  null
)

export function SiteConfigProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  const [config, setConfig] = React.useState<PublicConfig | null>(null)
  const [loading, setLoading] = React.useState(true)

  const fetchConfig = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await getPublicConfig()
      if (res.code === 0) {
        setConfig(res.data)
        // 站点默认语言只影响尚未手动选择语言的用户。
        await applySiteDefaultLocale(res.data.defaultLocale)
      }
    } catch {
      // 忽略错误
    }
    setLoading(false)
  }, [])

  React.useEffect(() => {
    void fetchConfig()
  }, [fetchConfig])

  const refresh = React.useCallback(() => fetchConfig(true), [fetchConfig])

  // 动态更新页面标题和描述
  React.useEffect(() => {
    if (!config) return

    const siteName = config.siteName || t("common.admin")
    const description = config.siteDescription || t("common.adminDescription")

    document.title = siteName

    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement("meta")
      metaDesc.setAttribute("name", "description")
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute("content", description)
  }, [config, t])

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    )
  }

  return (
    <SiteConfigContext.Provider value={{ config, loading, refresh }}>
      {children}
    </SiteConfigContext.Provider>
  )
}

export function useSiteConfig() {
  const context = React.useContext(SiteConfigContext)
  if (!context)
    throw new Error("useSiteConfig must be used within SiteConfigProvider")
  return context
}
