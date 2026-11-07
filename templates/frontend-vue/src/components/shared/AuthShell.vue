<script setup lang="ts">
import { computed } from "vue"
import BrandMark from "@/components/BrandMark.vue"
import { useSiteConfigStore } from "@/stores/site-config"

const siteConfig = useSiteConfigStore()

const siteName = computed(() => siteConfig.config?.siteName || "管理系统")
const siteDescription = computed(
  () => siteConfig.config?.siteDescription || "登录后管理用户、角色与系统设置"
)
</script>

<template>
  <div
    class="flex min-h-svh flex-col items-center justify-center gap-6 px-(--layout-gutter) py-8 pb-[max(2rem,env(safe-area-inset-bottom))]"
  >
    <div class="flex flex-col items-center gap-2 text-center">
      <BrandMark class="size-10" />
      <div class="flex flex-col gap-1">
        <h1 class="text-xl font-semibold tracking-tight">{{ siteName }}</h1>
        <span class="text-sm text-muted-foreground">{{ siteDescription }}</span>
      </div>
    </div>
    <div class="w-full max-w-sm">
      <slot />
    </div>
  </div>
</template>
