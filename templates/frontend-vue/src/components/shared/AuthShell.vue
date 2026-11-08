<script setup lang="ts">
import { computed } from "vue"
import { Database, ScrollText, ShieldCheck } from "@lucide/vue"
import BrandMark from "@/components/BrandMark.vue"
import { DEFAULT_SITE_NAME } from "@/lib/pwa"
import { useSiteConfigStore } from "@/stores/site-config"

const siteConfig = useSiteConfigStore()

const siteName = computed(
  () => siteConfig.config?.siteName || DEFAULT_SITE_NAME
)
const siteDescription = computed(
  () => siteConfig.config?.siteDescription || "登录后管理用户、角色与系统设置"
)

const highlights = [
  { icon: ShieldCheck, label: "细粒度权限" },
  { icon: ScrollText, label: "操作审计" },
  { icon: Database, label: "数据导入导出" },
]
</script>

<template>
  <main
    class="flex min-h-svh items-center justify-center bg-background px-(--layout-gutter) py-6 pb-[max(2rem,env(safe-area-inset-bottom))] md:py-10"
  >
    <div
      class="grid w-full max-w-6xl overflow-hidden rounded-[min(var(--radius-4xl),24px)] border bg-card shadow-xl ring-1 ring-foreground/5 max-lg:rounded-none max-lg:border-0 max-lg:bg-transparent max-lg:shadow-none max-lg:ring-0 lg:grid-cols-[1.08fr_1fr] dark:ring-foreground/10"
    >
      <aside
        class="relative hidden flex-col justify-between gap-10 bg-primary p-10 text-primary-foreground lg:flex xl:p-14 dark:border-border dark:bg-background dark:text-foreground dark:lg:border-r"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-card shadow-sm"
          >
            <BrandMark class="size-8" />
          </div>
          <div class="flex min-w-0 flex-col">
            <p class="truncate text-base font-semibold">{{ siteName }}</p>
            <p
              class="line-clamp-2 text-sm text-primary-foreground/60 dark:text-muted-foreground"
            >
              {{ siteDescription }}
            </p>
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <p
            class="text-3xl leading-[1.15] font-semibold tracking-tight text-balance xl:text-4xl"
          >
            把用户、权限与数据，<br />
            收进一个工作台。
          </p>
          <p
            class="max-w-md text-sm leading-relaxed text-primary-foreground/60 dark:text-muted-foreground"
          >
            用户、角色、菜单权限、审计与数据管理，共用同一套权限模型。
          </p>
        </div>

        <div
          class="flex flex-wrap gap-x-6 gap-y-3 text-xs text-primary-foreground/60 dark:text-muted-foreground"
        >
          <span
            v-for="item in highlights"
            :key="item.label"
            class="flex items-center gap-1.5"
          >
            <component :is="item.icon" class="size-3.5" />
            {{ item.label }}
          </span>
        </div>
      </aside>

      <section class="flex flex-col justify-center p-5 py-8 sm:p-8 lg:p-12">
        <div class="mx-auto flex w-full max-w-sm flex-col gap-6">
          <div class="flex items-center gap-3 lg:hidden">
            <BrandMark class="size-9" />
            <div class="flex min-w-0 flex-col">
              <p class="truncate text-sm font-semibold">{{ siteName }}</p>
              <p class="line-clamp-1 text-xs text-muted-foreground">
                {{ siteDescription }}
              </p>
            </div>
          </div>
          <slot />
        </div>
      </section>
    </div>
  </main>
</template>
