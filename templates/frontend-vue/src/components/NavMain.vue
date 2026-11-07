<script setup lang="ts">
import { useRoute } from "vue-router"
import { RouterLink } from "vue-router"
import MenuIcon from "@/components/shared/MenuIcon.vue"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

type NavItem = {
  title: string
  url: string
  icon: string
}

type NavGroup = {
  label: string
  items: NavItem[]
}

defineProps<{
  groups: NavGroup[]
}>()

const route = useRoute()
const { isMobile, setOpenMobile } = useSidebar()

function isActivePath(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`)
}

function handleNavigate() {
  if (isMobile.value) setOpenMobile(false)
}
</script>

<template>
  <SidebarGroup v-for="group in groups" :key="group.label">
    <SidebarGroupLabel>{{ group.label }}</SidebarGroupLabel>
    <SidebarMenu>
      <SidebarMenuItem v-for="item in group.items" :key="item.url">
        <SidebarMenuButton
          as-child
          :is-active="isActivePath(route.path, item.url)"
          :tooltip="item.title"
        >
          <RouterLink :to="item.url" @click="handleNavigate">
            <MenuIcon :name="item.icon" />
            <span>{{ item.title }}</span>
          </RouterLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroup>
</template>
