<script setup lang="ts">
import { ref } from 'vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppHeader from '@/components/AppHeader.vue'
import ToastContainer from '@/components/ToastContainer.vue'

const sidebarCollapsed = ref(false)

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <AppSidebar
      :collapsed="sidebarCollapsed"
      class="shrink-0 transition-all duration-200"
      :class="sidebarCollapsed ? 'w-16' : 'w-64'"
    />

    <div class="flex flex-1 flex-col overflow-hidden">
      <AppHeader :sidebar-collapsed="sidebarCollapsed" @toggle-sidebar="toggleSidebar" />
      <main class="flex-1 overflow-auto px-4 py-6 md:px-6">
        <router-view />
      </main>
      <footer class="shrink-0 border-t border-base-content/10 px-4 py-3 text-center text-xs text-base-content/40">
        © {{ new Date().getFullYear() }} hmilyld. All rights reserved.
      </footer>
    </div>
    <ToastContainer />
  </div>
</template>
