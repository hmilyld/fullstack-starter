export type SidebarVariant = "sidebar" | "floating" | "inset"
export type SidebarCollapsible = "icon" | "offcanvas"

type LayoutState = {
  variant: SidebarVariant
  collapsible: SidebarCollapsible
}

const STORAGE_KEY = "layout-config"
const defaults: LayoutState = { variant: "sidebar", collapsible: "icon" }

function readConfig(): LayoutState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as Partial<LayoutState>
    const variant = ["sidebar", "floating", "inset"].includes(
      parsed.variant ?? ""
    )
      ? (parsed.variant as SidebarVariant)
      : defaults.variant
    return {
      variant,
      collapsible: parsed.collapsible === "offcanvas" ? "offcanvas" : "icon",
    }
  } catch {
    return defaults
  }
}

// 模块级状态：侧栏与外观抽屉共享
let state = $state<LayoutState>(readConfig())

function persist(next: LayoutState) {
  state = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 隐私模式下不可写，忽略
  }
}

export function useLayoutConfig() {
  return {
    get variant() {
      return state.variant
    },
    get collapsible() {
      return state.collapsible
    },
    setVariant: (value: SidebarVariant) =>
      persist({ ...state, variant: value }),
    setCollapsible: (value: SidebarCollapsible) =>
      persist({ ...state, collapsible: value }),
  }
}
