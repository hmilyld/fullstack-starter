<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { Bell, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next'

defineProps<{
  isMobile: boolean
  sidebarCollapsed?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const route = useRoute()
const router = useRouter()

const routeMap: Record<string, { label: string; hasRoute?: boolean }> = {
  dashboard: { label: '仪表盘' },
  settings: { label: '设置', hasRoute: false },
  user: { label: '用户管理' },
  role: { label: '角色管理' },
  permission: { label: '权限管理' },
  profile: { label: '个人设置' },
  system: { label: '系统设置' },
  'ai-model': { label: 'AI模型配置' },
}

const breadcrumbs = computed(() => {
  const segments = route.path.split('/').filter(Boolean)
  const crumbs: { segment: string; label: string; path: string; hasRoute: boolean }[] = []

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    const routeInfo = routeMap[seg]
    if (!routeInfo) continue
    const path = `/${segments.slice(0, i + 1).join('/')}`
    crumbs.push({
      segment: seg,
      label: routeInfo.label,
      path,
      hasRoute: routeInfo.hasRoute !== false,
    })
  }

  return crumbs
})
</script>

<template>
  <header class="bg-base-100 flex h-12 shrink-0 items-center gap-2 border-b border-base-content/10 px-4">
    <div class="flex items-center gap-2">
      <button class="btn btn-ghost btn-xs btn-square" @click="emit('toggle-sidebar')">
        <Menu v-if="isMobile" class="size-4" />
        <template v-else>
          <PanelLeftClose v-if="!sidebarCollapsed" class="size-4" />
          <PanelLeftOpen v-else class="size-4" />
        </template>
      </button>
      <div class="breadcrumbs text-sm">
        <ul>
          <li class="hidden md:block">
            <a class="text-base-content/50 hover:text-base-content" @click.prevent="router.push('/dashboard')">管理后台</a>
          </li>
          <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
            <li>
              <span
                v-if="index === breadcrumbs.length - 1 || !crumb.hasRoute"
                class="font-medium text-base-content"
              >
                {{ crumb.label }}
              </span>
              <a
                v-else
                class="text-base-content/50 hover:text-base-content"
                @click.prevent="router.push(crumb.path)"
              >
                {{ crumb.label }}
              </a>
            </li>
          </template>
        </ul>
      </div>
    </div>
    <div class="ml-auto flex items-center gap-1">
      <button class="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-base-content">
        <Bell class="size-4" />
      </button>
      <ThemeToggle />
    </div>
  </header>
</template>
