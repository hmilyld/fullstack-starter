<script setup lang="ts">
import { computed } from "vue"
import { RouterLink, useRoute } from "vue-router"
import ThemeToggle from "@/components/ThemeToggle.vue"
import UserMenu from "@/components/UserMenu.vue"
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

const route = useRoute()
const crumbs = computed(() => buildBreadcrumbs(route.path))
const currentCrumb = computed(() => crumbs.value[crumbs.value.length - 1])
</script>

<template>
  <header
    class="sticky top-0 z-20 shrink-0 border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/80"
  >
    <div
      class="mx-auto flex min-h-14 w-full max-w-(--layout-max) items-center gap-2 px-(--layout-gutter) py-2"
    >
      <div class="flex min-w-0 items-center gap-2">
        <SidebarTrigger class="-ml-1" />
        <Separator
          orientation="vertical"
          class="mr-2 hidden data-[orientation=vertical]:h-4 md:block"
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
        <ThemeToggle />
        <UserMenu />
      </div>
    </div>
  </header>
</template>
