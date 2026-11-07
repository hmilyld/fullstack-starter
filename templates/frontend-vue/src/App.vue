<script setup lang="ts">
import { onErrorCaptured, onMounted, ref, watch } from "vue"
import { RouterLink, RouterView, useRoute } from "vue-router"
import { TriangleAlert } from "@lucide/vue"
import EmptyState from "@/components/shared/EmptyState.vue"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/sonner"
import { useMediaQuery } from "@/composables/use-media-query"
import { usePwaManifest } from "@/composables/use-pwa-manifest"
import { DEFAULT_SITE_DESCRIPTION, DEFAULT_SITE_NAME } from "@/lib/pwa"
import { useSiteConfigStore } from "@/stores/site-config"
import { useThemeStore } from "@/stores/theme"

const route = useRoute()
const siteConfig = useSiteConfigStore()
const themeStore = useThemeStore()
const isDesktop = useMediaQuery("(min-width: 768px)")
const appError = ref<string | null>(null)

usePwaManifest()

onMounted(async () => {
  await siteConfig.fetchConfig()
})

onErrorCaptured((error) => {
  const message = error instanceof Error ? error.message : ""
  appError.value = message || "页面加载失败，请刷新后重试。"
  return false
})

watch(
  () => route.fullPath,
  () => {
    if (appError.value) appError.value = null
  }
)

watch(
  () => siteConfig.config,
  (config) => {
    if (config) {
      document.title = config.siteName || DEFAULT_SITE_NAME
      let metaDesc = document.querySelector('meta[name="description"]')
      if (!metaDesc) {
        metaDesc = document.createElement("meta")
        metaDesc.setAttribute("name", "description")
        document.head.appendChild(metaDesc)
      }
      metaDesc.setAttribute(
        "content",
        config.siteDescription || DEFAULT_SITE_DESCRIPTION
      )
    }
  },
  { immediate: true }
)
</script>

<template>
  <div v-if="appError" class="flex min-h-svh items-center justify-center p-6">
    <EmptyState
      class="max-w-lg"
      :icon="TriangleAlert"
      title="页面加载失败"
      :description="appError"
    >
      <template #action>
        <Button as-child>
          <RouterLink to="/dashboard" @click="appError = null"
            >返回仪表盘</RouterLink
          >
        </Button>
      </template>
    </EmptyState>
  </div>
  <div
    v-else-if="siteConfig.loading"
    class="flex min-h-svh items-center justify-center"
  >
    <div class="flex flex-col items-center gap-4">
      <Skeleton class="h-8 w-48" />
      <Skeleton class="h-4 w-32" />
    </div>
  </div>
  <RouterView v-else />
  <Toaster
    :theme="themeStore.resolvedTheme"
    :position="isDesktop ? 'bottom-right' : 'top-center'"
    :mobile-offset="{ top: '4.5rem' }"
    rich-colors
    close-button
  />
</template>
