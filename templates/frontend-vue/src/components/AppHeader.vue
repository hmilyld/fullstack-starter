<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue"
import { RouterLink, useRoute } from "vue-router"
import { Search } from "@lucide/vue"
import ConfigDrawer from "@/components/ConfigDrawer.vue"
import ThemeToggle from "@/components/ThemeToggle.vue"
import UserMenu from "@/components/UserMenu.vue"
import { openCommandMenu } from "@/composables/use-command-menu"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { buildBreadcrumbs } from "@/lib/routes"
import { cn } from "@/lib/utils"

const route = useRoute()
const crumbs = computed(() => buildBreadcrumbs(route.path))
const currentCrumb = computed(() => crumbs.value[crumbs.value.length - 1])
const scrolled = ref(false)

function onScroll() {
  scrolled.value = window.scrollY > 10
}

onMounted(() => {
  onScroll()
  window.addEventListener("scroll", onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll)
})
</script>

<template>
  <header
    :class="
      cn(
        'sticky top-0 z-30 shrink-0 border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/80',
        scrolled && 'shadow-sm'
      )
    "
  >
    <div
      class="mx-auto flex h-14 w-full max-w-(--layout-max) items-center gap-2 px-(--layout-gutter) md:h-16"
    >
      <div class="flex min-w-0 items-center gap-2">
        <SidebarTrigger class="-ml-1" />
        <Separator
          orientation="vertical"
          class="mr-1 hidden h-5 self-center md:block"
        />
        <Breadcrumb class="hidden md:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink as-child>
                <RouterLink to="/dashboard">管理后台</RouterLink>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <template v-for="(crumb, index) in crumbs" :key="crumb.path">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage
                  v-if="index === crumbs.length - 1 || !crumb.hasRoute"
                >
                  {{ crumb.label }}
                </BreadcrumbPage>
                <BreadcrumbLink v-else as-child>
                  <RouterLink :to="crumb.path">{{ crumb.label }}</RouterLink>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </template>
          </BreadcrumbList>
        </Breadcrumb>
        <span class="truncate text-sm font-medium md:hidden">
          {{ currentCrumb?.label ?? "管理后台" }}
        </span>
      </div>

      <div class="ml-auto flex items-center gap-1">
        <Button
          variant="outline"
          class="hidden w-44 justify-start gap-2 text-sm font-normal text-muted-foreground shadow-none lg:inline-flex xl:w-60"
          aria-keyshortcuts="Meta+K Control+K"
          @click="openCommandMenu"
        >
          <Search class="size-4 shrink-0" />
          <span class="truncate">搜索…</span>
          <kbd
            class="ml-auto rounded-sm border bg-muted px-1.5 py-0.5 font-mono text-[10px]"
          >
            ⌘K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          class="lg:hidden"
          aria-label="搜索页面或菜单"
          @click="openCommandMenu"
        >
          <Search />
        </Button>
        <ThemeToggle />
        <ConfigDrawer />
        <Separator
          orientation="vertical"
          class="mx-1 hidden h-5 self-center sm:block"
        />
        <UserMenu />
      </div>
    </div>
  </header>
</template>
