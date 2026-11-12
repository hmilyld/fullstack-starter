<script setup lang="ts">
import { RouterView } from "vue-router"
import AppSidebar from "@/components/AppSidebar.vue"
import AppHeader from "@/components/AppHeader.vue"
import CommandMenu from "@/components/CommandMenu.vue"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

const defaultOpen = window.matchMedia("(min-width: 1280px)").matches
// 构建时注入，值来自 package.json
const appVersion = __APP_VERSION__
</script>

<template>
  <SidebarProvider :default-open="defaultOpen">
    <a
      href="#main-content"
      class="sr-only rounded-lg bg-background px-3 py-2 text-sm font-medium ring-[3px] ring-ring focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
    >
      跳到主内容
    </a>
    <AppSidebar />
    <SidebarInset>
      <AppHeader />
      <main id="main-content" tabindex="-1" class="flex-1 outline-none">
        <RouterView v-slot="{ Component, route }">
          <div
            :key="route.path"
            class="mx-auto w-full max-w-(--layout-max) content-in px-(--layout-gutter) py-4 md:py-6"
          >
            <component :is="Component" />
          </div>
        </RouterView>
      </main>
      <footer
        class="shrink-0 px-(--layout-gutter) pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground"
      >
        © {{ new Date().getFullYear() }} hmilyld.com · v{{ appVersion }}
      </footer>
    </SidebarInset>
    <CommandMenu />
  </SidebarProvider>
</template>
