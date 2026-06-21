<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useSiteConfigStore } from '@/stores/site-config'

const siteConfig = useSiteConfigStore()

onMounted(async () => {
  await siteConfig.fetchConfig()
})

watch(() => siteConfig.config, (config) => {
  if (config) {
    document.title = config.siteName || '管理系统'
    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute('content', config.siteDescription || '')
  }
}, { immediate: true })
</script>

<template>
  <RouterView />
</template>
