<script setup lang="ts">
import { RouterView } from "vue-router"
import AppSidebar from "@/components/AppSidebar.vue"
import AppHeader from "@/components/AppHeader.vue"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

const defaultOpen = window.matchMedia("(min-width: 1024px)").matches
</script>

<template>
  <SidebarProvider :default-open="defaultOpen">
    <a
      href="#main-content"
      class="sr-only rounded-lg bg-background px-3 py-2 text-sm font-medium ring-3 ring-ring/30 focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
    >
      跳到主内容
    </a>
    <AppSidebar />
    <SidebarInset>
      <AppHeader />
      <main id="main-content" tabindex="-1" class="flex-1 outline-none">
        <div
          class="mx-auto w-full max-w-(--layout-max) px-(--layout-gutter) py-4 md:py-6"
        >
          <RouterView />
        </div>
      </main>
      <footer
        class="shrink-0 border-t px-(--layout-gutter) pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground"
      >
        © {{ new Date().getFullYear() }} hmilyld. All rights reserved.
      </footer>
    </SidebarInset>
  </SidebarProvider>
</template>
