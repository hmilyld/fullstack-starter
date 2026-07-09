import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getPublicConfig } from '@/lib/api'
import type { PublicConfig } from '@/lib/api'

export const useSiteConfigStore = defineStore('site-config', () => {
  const config = ref<PublicConfig | null>(null)
  const loading = ref(true)

  async function fetchConfig() {
    loading.value = true
    try {
      const res = await getPublicConfig()
      if (res.code === 0) {
        config.value = res.data
      }
    } catch {
      // ignore
    }
    loading.value = false
  }

  async function refresh() {
    await fetchConfig()
  }

  return { config, loading, fetchConfig, refresh }
})
