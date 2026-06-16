import * as React from "react"
import { getPublicConfig } from "@/lib/api"

type PublicConfig = {
  siteName: string
  siteDescription: string
  maintenanceEnabled: boolean
  maintenanceMessage: string
  openRegistration: boolean
  manualReview: boolean
}

type SystemConfigContextType = {
  config: PublicConfig | null
  loading: boolean
  refresh: () => Promise<void>
}

const SystemConfigContext = React.createContext<SystemConfigContextType | null>(null)

export function SystemConfigProvider({ children }: { children: React.ReactNode }) {
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

    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute("content", description)
    }
  }, [config])

  return (
    <SystemConfigContext.Provider value={{ config, loading, refresh: fetchConfig }}>
      {children}
    </SystemConfigContext.Provider>
  )
}

export function useSystemConfig() {
  const context = React.useContext(SystemConfigContext)
  if (!context) throw new Error("useSystemConfig must be used within SystemConfigProvider")
  return context
}
