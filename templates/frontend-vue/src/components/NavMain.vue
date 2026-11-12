<script setup lang="ts">
import { computed, ref } from "vue"
import { RouterLink, useRoute } from "vue-router"
import { ChevronRight } from "@lucide/vue"
import MenuIcon from "@/components/shared/MenuIcon.vue"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  CollapsibleContent,
  CollapsibleRoot,
  CollapsibleTrigger,
} from "reka-ui"

type NavItem = {
  title: string
  url: string
  icon: string
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const props = defineProps<{
  groups: NavGroup[]
}>()

const CLOSED_GROUPS_KEY = "sidebar-closed-groups"

const route = useRoute()
const { state, isMobile, setOpenMobile } = useSidebar()

function readClosedGroups(): string[] {
  try {
    const raw = window.localStorage.getItem(CLOSED_GROUPS_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : []
  } catch {
    return []
  }
}

const closedGroups = ref<string[]>(readClosedGroups())
const iconMode = computed(() => state.value === "collapsed" && !isMobile.value)

const activeGroup = computed(
  () =>
    props.groups.find((group) =>
      group.items.some((item) => isActivePath(route.path, item.url))
    )?.label
)

function isActivePath(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`)
}

function isOpen(group: NavGroup) {
  return (
    group.label === activeGroup.value ||
    !closedGroups.value.includes(group.label)
  )
}

function toggleGroup(group: NavGroup, value: boolean) {
  const next = value
    ? closedGroups.value.filter((label) => label !== group.label)
    : [...closedGroups.value, group.label]
  closedGroups.value = next
  try {
    window.localStorage.setItem(CLOSED_GROUPS_KEY, JSON.stringify(next))
  } catch {
    // 隐私模式下 localStorage 不可写，忽略
  }
}

function handleNavigate() {
  if (isMobile.value) setOpenMobile(false)
}
</script>

<template>
  <CollapsibleRoot
    v-for="group in groups"
    :key="group.label"
    :open="iconMode || isOpen(group)"
    :disabled="iconMode"
    @update:open="(value: boolean) => toggleGroup(group, value)"
  >
    <SidebarGroup>
      <SidebarGroupLabel as-child>
        <CollapsibleTrigger
          class="group/label w-full justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <span class="truncate">{{ group.label }}</span>
          <ChevronRight
            :class="[
              'size-3.5 shrink-0 opacity-60 transition-transform duration-200',
              (iconMode || isOpen(group)) && 'rotate-90',
            ]"
          />
        </CollapsibleTrigger>
      </SidebarGroupLabel>
      <CollapsibleContent data-slot="collapsible-content">
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
      </CollapsibleContent>
    </SidebarGroup>
  </CollapsibleRoot>
</template>
