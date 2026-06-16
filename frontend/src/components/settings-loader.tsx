import * as React from "react"
import { getPublicConfig } from "@/lib/api"
import type { PublicConfig } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

const SettingsContext = React.createContext<PublicConfig | null>(null)

export function useSystemConfig() {
  return React.useContext(SettingsContext)
}

export function SettingsLoader({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = React.useState<PublicConfig | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    getPublicConfig()
      .then((res) => {
        if (res.code === 0) {
          setConfig(res.data)
          document.title = res.data.siteName || "管理系统"

          let metaDesc = document.querySelector('meta[name="description"]')
          if (!metaDesc) {
            metaDesc = document.createElement("meta")
            metaDesc.setAttribute("name", "description")
            document.head.appendChild(metaDesc)
          }
          metaDesc.setAttribute("content", res.data.siteDescription || "")
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false)
      })
  }, [])

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

  return <SettingsContext value={config}>{children}</SettingsContext>
}
