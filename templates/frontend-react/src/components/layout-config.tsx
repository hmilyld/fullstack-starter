import * as React from "react"

export type SidebarVariant = "sidebar" | "floating" | "inset"
export type SidebarCollapsible = "icon" | "offcanvas"

type LayoutConfig = {
  variant: SidebarVariant
  collapsible: SidebarCollapsible
  setVariant: (variant: SidebarVariant) => void
  setCollapsible: (collapsible: SidebarCollapsible) => void
}

const STORAGE_KEY = "layout-config"

const defaults: Pick<LayoutConfig, "variant" | "collapsible"> = {
  variant: "sidebar",
  collapsible: "icon",
}

function readConfig(): Pick<LayoutConfig, "variant" | "collapsible"> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as Partial<LayoutConfig>
    return {
      variant: ["sidebar", "floating", "inset"].includes(parsed.variant ?? "")
        ? (parsed.variant as SidebarVariant)
        : defaults.variant,
      collapsible: parsed.collapsible === "offcanvas" ? "offcanvas" : "icon",
    }
  } catch {
    return defaults
  }
}

const LayoutConfigContext = React.createContext<LayoutConfig | null>(null)

/** 侧栏样式与折叠方式：外观抽屉与 AppSidebar 共用 */
export function LayoutConfigProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [config, setConfig] = React.useState(readConfig)

  const update = React.useCallback(
    (patch: Partial<Pick<LayoutConfig, "variant" | "collapsible">>) => {
      setConfig((previous) => {
        const next = { ...previous, ...patch }
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch {
          // 隐私模式下不可写，忽略
        }
        return next
      })
    },
    []
  )

  const value = React.useMemo<LayoutConfig>(
    () => ({
      ...config,
      setVariant: (variant) => update({ variant }),
      setCollapsible: (collapsible) => update({ collapsible }),
    }),
    [config, update]
  )

  return (
    <LayoutConfigContext.Provider value={value}>
      {children}
    </LayoutConfigContext.Provider>
  )
}

export function useLayoutConfig() {
  const context = React.useContext(LayoutConfigContext)
  if (!context) {
    throw new Error("useLayoutConfig must be used within LayoutConfigProvider")
  }
  return context
}
