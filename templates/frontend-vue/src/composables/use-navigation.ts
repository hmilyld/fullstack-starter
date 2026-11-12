import { readonly, ref } from "vue"

import { getNavigation } from "@/api/menu"
import type { NavigationGroup } from "@/types/menu"

const NAVIGATION_REFRESH_EVENT = "navigation-refresh"

const groups = ref<NavigationGroup[]>([])
const loaded = ref(false)
let inflight: Promise<void> | null = null

async function load(force = false): Promise<void> {
  if (inflight) return inflight
  if (loaded.value && !force) return

  inflight = getNavigation()
    .then((response) => {
      if (response.code === 0) groups.value = response.data
      loaded.value = true
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
    groups: readonly(groups),
    loaded: readonly(loaded),
    load,
  }
}

export function onNavigationRefresh(handler: () => void) {
  window.addEventListener(NAVIGATION_REFRESH_EVENT, handler)
  return () => window.removeEventListener(NAVIGATION_REFRESH_EVENT, handler)
}

export { NAVIGATION_REFRESH_EVENT }
