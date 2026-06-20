<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import { computed } from 'vue'
import { Sun, Moon } from 'lucide-vue-next'

const themeStore = useThemeStore()

const isDark = computed(() => {
  if (themeStore.theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return themeStore.theme === 'dark'
})
</script>

<template>
  <div class="dropdown dropdown-end">
    <div tabindex="0" role="button" class="btn btn-ghost btn-xs btn-square">
      <Transition name="theme-icon" mode="out-in">
        <Sun v-if="!isDark" key="sun" class="size-4" />
        <Moon v-else key="moon" class="size-4" />
      </Transition>
    </div>
    <ul tabindex="0" class="dropdown-content menu bg-base-100 border border-base-content/10 rounded-box z-10 w-32 p-1 shadow-sm">
      <li>
        <button class="text-xs" :class="{ active: themeStore.theme === 'light' }" @click="themeStore.setTheme('light')">浅色</button>
      </li>
      <li>
        <button class="text-xs" :class="{ active: themeStore.theme === 'dark' }" @click="themeStore.setTheme('dark')">深色</button>
      </li>
      <li>
        <button class="text-xs" :class="{ active: themeStore.theme === 'system' }" @click="themeStore.setTheme('system')">跟随系统</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: all 0.2s ease;
}

.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.8);
}

.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.8);
}
</style>
