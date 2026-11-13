import { getNavigation } from "#lib/api/menu.js"
import type { NavigationGroup } from "#lib/types/menu.js"

const NAVIGATION_REFRESH_EVENT = "navigation-refresh"

let groups = $state<NavigationGroup[]>([])
let loaded = $state(false)
let inflight: Promise<void> | null = null

async function load(force = false): Promise<void> {
  if (inflight) return inflight
  if (loaded && !force) return

  inflight = getNavigation()
    .then((response) => {
      if (response.code === 0) groups = response.data
      loaded = true
    })
    .catch(() => {
      // 导航不是关键路径，失败时保留上一次结果
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

/** 侧边栏与命令面板共用的导航数据 */
export function useNavigation() {
  return {
    get groups() {
      return groups
    },
    get loaded() {
      return loaded
    },
    load,
  }
}

export function onNavigationRefresh(handler: () => void) {
  window.addEventListener(NAVIGATION_REFRESH_EVENT, handler)
  return () => window.removeEventListener(NAVIGATION_REFRESH_EVENT, handler)
}

export { NAVIGATION_REFRESH_EVENT }
