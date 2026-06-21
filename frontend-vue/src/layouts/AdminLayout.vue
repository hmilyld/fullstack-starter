<script setup lang="ts">
import { ref, watch } from 'vue'
import { useMobile } from '@/composables/use-mobile'
import AppSidebar from '@/components/AppSidebar.vue'
import AppHeader from '@/components/AppHeader.vue'
import ToastContainer from '@/components/ToastContainer.vue'

const isMobile = useMobile()
const sidebarCollapsed = ref(false)
const mobileMenuOpen = ref(false)

function toggleSidebar() {
  if (isMobile.value) {
    mobileMenuOpen.value = !mobileMenuOpen.value
  } else {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

watch(isMobile, (val) => {
  if (!val) mobileMenuOpen.value = false
})
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Desktop sidebar -->
    <AppSidebar
      v-if="!isMobile"
      :is-mobile="false"
      :collapsed="sidebarCollapsed"
      class="shrink-0 transition-all duration-200"
      :class="sidebarCollapsed ? 'w-16' : 'w-64'"
    />

    <!-- Mobile sidebar overlay -->
    <template v-if="isMobile">
      <div
        v-show="mobileMenuOpen"
        class="fixed inset-0 z-40 bg-black/50 transition-opacity"
        @click="closeMobileMenu"
      ></div>
      <div
        class="fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-200"
        :class="mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        <AppSidebar :is-mobile="true" @navigate="closeMobileMenu" />
      </div>
    </template>

    <div class="flex flex-1 flex-col overflow-hidden">
      <AppHeader
        :is-mobile="isMobile"
        :sidebar-collapsed="sidebarCollapsed"
        :mobile-menu-open="mobileMenuOpen"
        @toggle-sidebar="toggleSidebar"
      />
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
