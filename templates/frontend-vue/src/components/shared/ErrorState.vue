<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { CircleAlert, RefreshCw } from "@lucide/vue"
import EmptyState from "@/components/shared/EmptyState.vue"
import { Button } from "@/components/ui/button"

defineProps<{
  message: string
  onRetry: () => void
}>()

const { t } = useI18n()
</script>

<template>
  <EmptyState
    :icon="CircleAlert"
    :title="t('common.loadFailed')"
    :description="message"
  >
    <template #action>
      <Button variant="outline" @click="onRetry">
        <RefreshCw data-icon="inline-start" />
        {{ t("common.retry") }}
      </Button>
    </template>
  </EmptyState>
</template>
