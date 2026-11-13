import { getNavigation } from "#lib/api/menu.js"
import type { NavigationGroup } from "#lib/types/menu.js"

const NAVIGATION_REFRESH_EVENT = "navigation-refresh"

let groups = $state<NavigationGroup[]>([])
let loaded = $state(false)
let inflight: Promise<void> | null = null
let generation = 0

async function load(force = false): Promise<void> {
  if (inflight && !force) return inflight
  if (loaded && !force) return

  const current = ++generation
  const request = getNavigation()
    .then((response) => {
      if (current !== generation) return
      if (response.code === 0) groups = response.data
      loaded = true
    })
    .catch(() => {
      // 导航不是关键路径，失败时保留上一次结果
    })
    .finally(() => {
      if (current === generation) inflight = null
    })

  inflight = request
  return request
}

/** 退出登录时清空导航缓存，避免下一位用户看到上一位用户的菜单 */
export function resetNavigation() {
  generation += 1
  groups = []
  loaded = false
  inflight = null
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
