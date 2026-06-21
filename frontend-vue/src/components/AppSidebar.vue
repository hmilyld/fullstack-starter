<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSiteConfigStore } from '@/stores/site-config'
import { logout as apiLogout } from '@/lib/api'
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  KeyRound,
  Settings2,
  Bot,
  ChevronsUpDown,
} from 'lucide-vue-next'

const props = defineProps<{
  isMobile: boolean
  collapsed?: boolean
}>()

const emit = defineEmits<{
  (e: 'navigate'): void
}>()

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const siteConfig = useSiteConfigStore()
const userMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

const siteName = computed(() => siteConfig.config?.siteName || '管理系统')

const navGroups = computed(() => {
  const groups = [
    {
      label: '导航',
      items: [
        { title: '仪表盘', url: '/dashboard', icon: LayoutDashboard, permission: 'dashboard' },
      ],
    },
    {
      label: '管理',
      items: [
        { title: '用户管理', url: '/settings/user', icon: Users, permission: 'users' },
        { title: '角色管理', url: '/settings/role', icon: ShieldCheck, permission: 'roles' },
        { title: '权限管理', url: '/settings/permission', icon: KeyRound, permission: 'permissions' },
        { title: '系统设置', url: '/settings/system', icon: Settings2, permission: 'settings' },
        { title: 'AI模型配置', url: '/settings/ai-model', icon: Bot, permission: 'ai_models' },
      ],
    },
  ]

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.permission || auth.hasPermission(item.permission),
      ),
    }))
    .filter((group) => group.items.length > 0)
})

function navigate(url: string) {
  router.push(url)
  userMenuOpen.value = false
  emit('navigate')
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

function handleClickOutside(e: MouseEvent) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target as Node)) {
    userMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

async function handleLogout() {
  await apiLogout()
  auth.logout()
  await siteConfig.refresh()
  router.push('/login')
}

const menuItemRefs = ref<HTMLElement[]>([])

function focusNextMenuItem() {
  if (menuItemRefs.value.length === 0) return
  const currentIndex = menuItemRefs.value.indexOf(document.activeElement as HTMLElement)
  const nextIndex = currentIndex < menuItemRefs.value.length - 1 ? currentIndex + 1 : 0
  menuItemRefs.value[nextIndex]?.focus()
}

function focusPrevMenuItem() {
  if (menuItemRefs.value.length === 0) return
  const currentIndex = menuItemRefs.value.indexOf(document.activeElement as HTMLElement)
  const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuItemRefs.value.length - 1
  menuItemRefs.value[prevIndex]?.focus()
}
</script>

<template>
  <aside class="bg-base-200 flex h-full flex-col border-r border-base-content/10">
    <!-- Logo -->
    <div class="flex items-center py-3" :class="collapsed ? 'justify-center px-0' : 'justify-start px-4'">
      <svg
        class="size-7 shrink-0"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="32" height="32" rx="8" class="fill-primary" />
        <path
          d="M8 12h6v2H8v-2zm0 4h10v2H8v-2zm0 4h8v2H8v-2z"
          class="fill-primary-content"
        />
        <rect
          x="18"
          y="10"
          width="8"
          height="8"
          rx="2"
          class="fill-primary-content"
          fill-opacity="0.8"
        />
        <path
          d="M20 13h4M20 15.5h4"
          stroke="currentColor"
          stroke-width="1.2"
          class="stroke-primary"
          stroke-linecap="round"
        />
      </svg>
      <span v-if="!collapsed" class="ml-2 truncate text-base font-semibold">{{ siteName }}</span>
    </div>

    <!-- Navigation -->
    <div class="flex-1 overflow-y-auto overflow-x-hidden">
      <template v-for="group in navGroups" :key="group.label">
        <div v-if="!collapsed" class="px-4 pt-3 pb-1 text-xs text-base-content/50">{{ group.label }}</div>
        <div class="flex flex-col gap-1" :class="collapsed ? 'px-2 py-1' : 'px-2'">
          <button
            v-for="item in group.items"
            :key="item.title"
            class="flex items-center rounded-md transition-colors hover:bg-base-300"
            :class="[
              collapsed ? 'justify-center px-0 py-2.5' : 'gap-2 px-3 py-2 text-sm',
              route.path === item.url ? 'bg-base-300' : ''
            ]"
            :title="collapsed ? item.title : undefined"
            @click="navigate(item.url)"
          >
            <component :is="item.icon" class="size-4 shrink-0" />
            <span v-if="!collapsed">{{ item.title }}</span>
          </button>
        </div>
      </template>
    </div>

    <!-- User -->
    <div class="px-2 pb-2" ref="userMenuRef">
      <div class="relative">
        <button
          class="flex w-full cursor-pointer items-center gap-2 rounded-md transition-colors hover:bg-base-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
          :class="collapsed ? 'justify-center px-0 py-2.5' : 'px-2 py-1.5'"
          @click.stop="toggleUserMenu"
          @keydown.escape="userMenuOpen = false"
          @keydown.down.prevent="focusNextMenuItem"
        >
          <div class="avatar avatar-placeholder size-7 shrink-0">
            <div class="w-7 rounded-md bg-base-content/10 text-base-content">
              <span class="text-xs">{{ auth.user?.name?.charAt(0) || '?' }}</span>
            </div>
          </div>
          <template v-if="!collapsed">
            <div class="flex flex-1 flex-col items-start overflow-hidden">
              <span class="truncate text-sm font-medium">{{ auth.user?.name }}</span>
              <span class="truncate text-xs text-base-content/40">{{ auth.user?.email }}</span>
            </div>
            <ChevronsUpDown class="size-3.5 shrink-0 text-base-content/40" />
          </template>
        </button>
        <div
          v-show="userMenuOpen"
          class="bg-base-100 border border-base-content/10 rounded-box absolute bottom-full left-0 mb-1 w-48 p-1 shadow-sm z-20"
          @keydown.escape="userMenuOpen = false"
          @keydown.up.prevent="focusPrevMenuItem"
        >
          <button
            ref="menuItemRefs"
            class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-base-200 focus:bg-base-200 focus:outline-none"
            @click="navigate('/settings/profile')"
            @keydown.escape="userMenuOpen = false"
            @keydown.down.prevent="focusNextMenuItem"
          >
            个人设置
          </button>
          <button
            class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-base-200 focus:bg-base-200 focus:outline-none"
            @click="navigate('/settings/profile?tab=security')"
            @keydown.escape="userMenuOpen = false"
            @keydown.down.prevent="focusNextMenuItem"
            @keydown.up.prevent="focusPrevMenuItem"
          >
            密码修改
          </button>
          <div class="my-1 h-px bg-base-content/10"></div>
          <button
            class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-base-200 focus:bg-base-200 focus:outline-none text-error"
            @click="handleLogout"
            @keydown.escape="userMenuOpen = false"
            @keydown.up.prevent="focusPrevMenuItem"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>
