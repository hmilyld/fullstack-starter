<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue"
import { RouterLink } from "vue-router"
import BrandMark from "@/components/BrandMark.vue"
import NavMain from "@/components/NavMain.vue"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { getNavigation } from "@/api/menu"
import { useSiteConfigStore } from "@/stores/site-config"
import type { NavigationGroup } from "@/types/menu"

const NAVIGATION_REFRESH_EVENT = "navigation-refresh"

const siteConfig = useSiteConfigStore()
const { isMobile, setOpenMobile } = useSidebar()
const navGroups = ref<NavigationGroup[]>([])

const siteName = computed(() => siteConfig.config?.siteName || "管理系统")

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

let cancelled = false

async function loadNavigation() {
  try {
    const response = await getNavigation()
    if (!cancelled && response.code === 0) navGroups.value = response.data
  } catch {
    // 导航不是关键路径，加载失败时保留上一次的菜单
  }
}

function handleHeaderClick() {
  if (isMobile.value) setOpenMobile(false)
}

onMounted(() => {
  void loadNavigation()
  window.addEventListener(NAVIGATION_REFRESH_EVENT, loadNavigation)
})

onUnmounted(() => {
  cancelled = true
  window.removeEventListener(NAVIGATION_REFRESH_EVENT, loadNavigation)
})
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <RouterLink
        to="/dashboard"
        class="flex items-center gap-2 rounded-lg px-2 py-1.5 outline-none group-data-[collapsible=icon]:justify-center focus-visible:ring-3 focus-visible:ring-ring/30 max-md:pr-10"
        @click="handleHeaderClick"
      >
        <BrandMark />
        <span
          class="truncate text-base font-semibold group-data-[collapsible=icon]:hidden"
        >
          {{ siteName }}
        </span>
      </RouterLink>
    </SidebarHeader>
    <SidebarContent>
      <NavMain :groups="groups" />
    </SidebarContent>
    <SidebarRail />
  </Sidebar>
</template>
