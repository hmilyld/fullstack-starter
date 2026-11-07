import { defineStore } from "pinia"
import { ref } from "vue"
import { getPublicConfig } from "@/api/system"
import type { PublicConfig } from "@/types/system"

export const useSiteConfigStore = defineStore("site-config", () => {
  const config = ref<PublicConfig | null>(null)
  const loading = ref(true)

  async function fetchConfig(silent = false) {
    if (!silent) loading.value = true
    try {
      const res = await getPublicConfig()
      if (res.code === 0) {
        config.value = res.data
      }
    } catch {
      // 忽略错误，保留上一次的配置
    }
    loading.value = false
  }

  /** 保存站点设置后静默刷新，避免页面出现 loading 骨架 */
  async function refresh() {
    await fetchConfig(true)
  }

  return { config, loading, fetchConfig, refresh }
})
