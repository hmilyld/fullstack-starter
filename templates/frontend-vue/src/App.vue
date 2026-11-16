<script setup lang="ts">
import { onErrorCaptured, onMounted, watch } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink, RouterView, useRoute } from "vue-router"
import { TriangleAlert } from "@lucide/vue"
import EmptyState from "@/components/shared/EmptyState.vue"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/sonner"
import { useMediaQuery } from "@/composables/use-media-query"
import { usePwaManifest } from "@/composables/use-pwa-manifest"
import { appError, clearAppError, setAppError } from "@/lib/app-error"
import { setPageTitle, setSiteName } from "@/lib/page-title"
import { useSiteConfigStore } from "@/stores/site-config"
import { useThemeStore } from "@/stores/theme"

const { t, locale } = useI18n()
const route = useRoute()
const siteConfig = useSiteConfigStore()
const themeStore = useThemeStore()
const isDesktop = useMediaQuery("(min-width: 768px)")

usePwaManifest()

onMounted(async () => {
  await siteConfig.fetchConfig()
})

onErrorCaptured((error) => {
  setAppError(error)
  return false
})

watch(
  () => route.fullPath,
  () => {
    clearAppError()
  }
)

watch(
  [() => siteConfig.config, locale],
  ([config]) => {
    setSiteName(config?.siteName || t("pwa.defaultName"))
    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement("meta")
      metaDesc.setAttribute("name", "description")
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute(
      "content",
      config?.siteDescription || t("pwa.defaultDescription")
    )
  },
  { immediate: true }
)

// 页面标题跟随路由与当前语言，与站点名的组合逻辑放在 lib/page-title
watch(
  [() => route.meta.titleKey, locale],
  ([titleKey]) => {
    setPageTitle(typeof titleKey === "string" ? t(titleKey) : null)
  },
  { immediate: true }
)
</script>

<template>
  <div v-if="appError" class="flex min-h-svh items-center justify-center p-6">
    <EmptyState
      class="max-w-lg"
      :icon="TriangleAlert"
      :title="t('errors.pageLoadFailed')"
      :description="appError"
    >
      <template #action>
        <Button as-child>
          <RouterLink to="/dashboard" @click="clearAppError()">{{
            t("errors.backToDashboard")
          }}</RouterLink>
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
