import * as React from "react"

import { getNavigation } from "@/api/menu"
import type { NavigationGroup } from "@/types/menu"

const NAVIGATION_REFRESH_EVENT = "navigation-refresh"

let cache: NavigationGroup[] | null = null
let inflight: Promise<NavigationGroup[]> | null = null

async function loadNavigation(force = false): Promise<NavigationGroup[]> {
  if (!force && cache) return cache
  if (inflight) return inflight

  inflight = getNavigation()
    .then((response) => {
      const data = response.code === 0 ? response.data : []
      cache = data
      return data
    })
    .catch(() => cache ?? [])
    .finally(() => {
      inflight = null
    })

  return inflight
}

/** 侧边栏与命令面板共用同一份导航数据，避免重复请求 */
export function useNavigation() {
  const [groups, setGroups] = React.useState<NavigationGroup[]>(cache ?? [])
  const [loading, setLoading] = React.useState(cache === null)

  React.useEffect(() => {
    let cancelled = false

    async function run(force: boolean) {
      const data = await loadNavigation(force)
      if (cancelled) return
      setGroups(data)
      setLoading(false)
    }

    void run(cache === null)
    const onRefresh = () => void run(true)
    window.addEventListener(NAVIGATION_REFRESH_EVENT, onRefresh)
    return () => {
      cancelled = true
      window.removeEventListener(NAVIGATION_REFRESH_EVENT, onRefresh)
    }
  }, [])

  return { groups, loading }
}

export { NAVIGATION_REFRESH_EVENT }
