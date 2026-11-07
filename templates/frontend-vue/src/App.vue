<script setup lang="ts">
import { onMounted, watch } from "vue"
import { RouterView } from "vue-router"
import { useSiteConfigStore } from "@/stores/site-config"
import { usePwaManifest } from "@/composables/use-pwa-manifest"
import { useMediaQuery } from "@/composables/use-media-query"
import { Toaster } from "@/components/ui/sonner"

const siteConfig = useSiteConfigStore()
const isDesktop = useMediaQuery("(min-width: 768px)")

usePwaManifest()

onMounted(async () => {
  await siteConfig.fetchConfig()
})

watch(
  () => siteConfig.config,
  (config) => {
    if (config) {
      document.title = config.siteName || "管理系统"
      let metaDesc = document.querySelector('meta[name="description"]')
      if (!metaDesc) {
        metaDesc = document.createElement("meta")
        metaDesc.setAttribute("name", "description")
        document.head.appendChild(metaDesc)
      }
      metaDesc.setAttribute("content", config.siteDescription || "")
    }
  },
  { immediate: true }
)
</script>

<template>
  <RouterView />
  <Toaster
    :position="isDesktop ? 'bottom-right' : 'top-center'"
    :mobile-offset="{ top: '4.5rem' }"
    rich-colors
    close-button
  />
</template>
