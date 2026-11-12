<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue"
import { RouterLink } from "vue-router"
import { Search } from "@lucide/vue"
import BrandMark from "@/components/BrandMark.vue"
import NavMain from "@/components/NavMain.vue"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { openCommandMenu } from "@/composables/use-command-menu"
import { useLayoutConfig } from "@/composables/use-layout-config"
import {
  onNavigationRefresh,
  useNavigation,
} from "@/composables/use-navigation"
import { DEFAULT_SITE_NAME } from "@/lib/pwa"
import { useSiteConfigStore } from "@/stores/site-config"

const siteConfig = useSiteConfigStore()
const { isMobile, setOpenMobile } = useSidebar()
const { groups: navGroups, load } = useNavigation()
const { variant, collapsible } = useLayoutConfig()

const siteName = computed(
  () => siteConfig.config?.siteName || DEFAULT_SITE_NAME
)
const siteDescription = computed(
  () => siteConfig.config?.siteDescription || "运营管理后台"
)

const groups = computed(() =>
  navGroups.value.map((group) => ({
    label: group.name,
    items: group.items.map((item) => ({
      title: item.name,
      url: item.route,
      icon: item.icon,
    })),
  }))
)

let disposeRefresh: (() => void) | null = null

function handleHeaderClick() {
  if (isMobile.value) setOpenMobile(false)
}

onMounted(() => {
  void load()
  disposeRefresh = onNavigationRefresh(() => {
    void load(true)
  })
})

onUnmounted(() => {
  disposeRefresh?.()
})
</script>

<template>
  <Sidebar :variant="variant" :collapsible="collapsible">
    <SidebarHeader class="gap-2 p-2">
      <RouterLink
        to="/dashboard"
        class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors outline-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 hover:bg-sidebar-accent focus-visible:ring-[3px] focus-visible:ring-sidebar-ring max-md:pr-10"
        @click="handleHeaderClick"
      >
        <BrandMark class="size-9 shrink-0" />
        <div
          class="grid min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden"
        >
          <span class="truncate font-heading text-sm font-semibold">
            {{ siteName }}
          </span>
          <span class="truncate text-xs text-muted-foreground">
            {{ siteDescription }}
          </span>
        </div>
      </RouterLink>
    </SidebarHeader>
    <SidebarContent>
      <NavMain :groups="groups" />
    </SidebarContent>
    <SidebarFooter class="gap-1 p-2 group-data-[collapsible=icon]:hidden">
      <button
        type="button"
        class="flex h-8 w-full items-center gap-2 rounded-md border bg-background px-2 text-xs text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-[3px] focus-visible:ring-sidebar-ring"
        @click="openCommandMenu"
      >
        <Search class="size-3.5 shrink-0" />
        <span>快速查找</span>
        <kbd
          class="ml-auto rounded-sm border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground"
        >
          ⌘K
        </kbd>
      </button>
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
