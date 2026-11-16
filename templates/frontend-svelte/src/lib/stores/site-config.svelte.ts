import { getPublicConfig } from "#lib/api/system.js"
import { applySiteDefaultLocale } from "#lib/i18n.js"
import type { PublicConfig } from "#lib/types/system.js"

let config = $state<PublicConfig | null>(null)
let loading = $state(true)

async function fetchConfig(silent = false) {
  if (!silent) loading = true
  try {
    const res = await getPublicConfig()
    if (res.code === 0) {
      config = res.data
      // 站点默认语言只影响尚未手动选择语言的用户。
      await applySiteDefaultLocale(res.data.defaultLocale)
    }
  } catch {
    // 忽略错误，保留上一次的配置
  }
  loading = false
}

/** 保存站点设置后静默刷新，避免页面出现 loading 骨架 */
async function refresh() {
  await fetchConfig(true)
}

export const siteConfig = {
  get config() {
    return config
  },
  get loading() {
    return loading
  },
  fetchConfig,
  refresh,
}
