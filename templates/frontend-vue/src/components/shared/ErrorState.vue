<script setup lang="ts">
import { CircleAlert, RefreshCw } from "@lucide/vue"
import EmptyState from "@/components/shared/EmptyState.vue"
import { Button } from "@/components/ui/button"

defineProps<{
  message: string
  onRetry: () => void
}>()
</script>

<template>
  <EmptyState :icon="CircleAlert" title="加载失败" :description="message">
    <template #action>
      <Button variant="outline" @click="onRetry">
        <RefreshCw data-icon="inline-start" />
        重试
      </Button>
    </template>
  </EmptyState>
</template>
