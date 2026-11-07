<script setup lang="ts">
import { CircleAlert } from "@lucide/vue"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

defineProps<{
  message: string
  onRetry: () => void
}>()
</script>

<template>
  <Alert variant="destructive" class="mb-4">
    <CircleAlert />
    <AlertTitle>刷新失败</AlertTitle>
    <AlertDescription>{{ message }}</AlertDescription>
    <AlertAction>
      <Button variant="outline" size="xs" @click="onRetry">重试</Button>
    </AlertAction>
  </Alert>
</template>
