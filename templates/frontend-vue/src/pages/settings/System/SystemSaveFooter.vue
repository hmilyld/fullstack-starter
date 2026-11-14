<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Save } from "@lucide/vue"
import LoadingButton from "@/components/shared/LoadingButton.vue"
import { CardFooter } from "@/components/ui/card"

defineProps<{
  dirty: boolean
  loading: boolean
  label: string
}>()

const emit = defineEmits<{
  (e: "save"): void
}>()

const { t } = useI18n()
</script>

<template>
  <CardFooter class="flex flex-wrap items-center gap-3">
    <LoadingButton
      :loading="loading"
      :disabled="!dirty"
      class="w-full md:w-auto"
      @click="emit('save')"
    >
      <Save data-icon="inline-start" />
      {{ label }}
    </LoadingButton>
    <span class="text-xs text-muted-foreground">
      {{ dirty ? t("systemPage.unsaved") : t("systemPage.saved") }}
    </span>
  </CardFooter>
</template>
