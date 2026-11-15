<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { RouterLink } from "vue-router"
import { Compass } from "@lucide/vue"
import EmptyState from "@/components/shared/EmptyState.vue"
import { Button } from "@/components/ui/button"

const { t } = useI18n()
</script>

<template>
  <div class="flex min-h-svh items-center justify-center p-6">
    <EmptyState
      class="max-w-lg"
      :icon="Compass"
      :title="t('errors.notFoundTitle')"
      :description="t('errors.notFoundDescription')"
    >
      <template #action>
        <Button as-child>
          <RouterLink to="/dashboard">{{
            t("errors.backToDashboard")
          }}</RouterLink>
        </Button>
      </template>
    </EmptyState>
  </div>
</template>
