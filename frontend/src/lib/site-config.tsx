import * as React from "react"
import { getPublicConfig } from "@/lib/api"
import type { PublicConfig } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

type SiteConfigContextType = {
  config: PublicConfig | null
  loading: boolean
  refresh: () => Promise<void>
}

const SiteConfigContext = React.createContext<SiteConfigContextType | null>(null)

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = React.useState<PublicConfig | null>(null)
  const [loading, setLoading] = React.useState(true)

  const fetchConfig = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await getPublicConfig()
      if (res.code === 0) {
        setConfig(res.data)
      }
    } catch {
      // 忽略错误
    }
    setLoading(false)
  }, [])

  React.useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  // 动态更新页面标题和描述
  React.useEffect(() => {
    if (!config) return

    const siteName = config.siteName || "管理系统"
    const description = config.siteDescription || "基于 React + shadcn/ui 的后台管理框架"

    document.title = siteName

    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement("meta")
      metaDesc.setAttribute("name", "description")
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute("content", description)
  }, [config])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    )
  }

  return (
    <SiteConfigContext.Provider value={{ config, loading, refresh: fetchConfig }}>
      {children}
    </SiteConfigContext.Provider>
  )
}

export function useSiteConfig() {
  const context = React.useContext(SiteConfigContext)
  if (!context) throw new Error("useSiteConfig must be used within SiteConfigProvider")
  return context
}
