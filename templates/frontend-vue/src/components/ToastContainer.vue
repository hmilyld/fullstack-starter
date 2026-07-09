<script setup lang="ts">
import { useToast } from '@/composables/use-toast'
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-vue-next'

const { toasts, removeToast } = useToast()

function iconFor(type: string) {
  switch (type) {
    case 'success': return CheckCircle
    case 'error': return AlertCircle
    case 'info': return Info
    case 'warning': return AlertTriangle
    default: return Info
  }
}

function colorFor(type: string) {
  switch (type) {
    case 'success': return 'text-success'
    case 'error': return 'text-error'
    case 'info': return 'text-info'
    case 'warning': return 'text-warning'
    default: return 'text-base-content'
  }
}
</script>

<template>
  <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        role="alert"
        class="pointer-events-auto flex items-center gap-3 rounded-lg border border-base-content/10 bg-base-100 px-4 py-3 shadow-lg"
      >
        <component :is="iconFor(toast.type)" class="size-4 shrink-0" :class="colorFor(toast.type)" />
        <span class="text-sm text-base-content">{{ toast.message }}</span>
        <button class="ml-2 shrink-0 text-base-content/40 hover:text-base-content" @click="removeToast(toast.id)">
          <X class="size-3.5" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active {
  animation: slide-in-from-top 0.2s ease-out;
}

.toast-leave-active {
  animation: slide-out-to-top 0.15s ease-in forwards;
}

@keyframes slide-in-from-top {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-out-to-top {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-100%);
  }
}
</style>
