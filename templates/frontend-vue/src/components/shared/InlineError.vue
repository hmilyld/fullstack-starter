<script setup lang="ts">
import { useI18n } from "vue-i18n"
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

const { t } = useI18n()
</script>

<template>
  <Alert variant="destructive" class="mb-4">
    <CircleAlert />
    <AlertTitle>{{ t("common.refreshFailed") }}</AlertTitle>
    <AlertDescription>{{ message }}</AlertDescription>
    <AlertAction>
      <Button variant="outline" size="xs" @click="onRetry">{{
        t("common.retry")
      }}</Button>
    </AlertAction>
  </Alert>
</template>
