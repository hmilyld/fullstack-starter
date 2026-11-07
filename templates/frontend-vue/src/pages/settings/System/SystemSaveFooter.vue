<script setup lang="ts">
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
      {{ dirty ? "有未保存的修改" : "已保存" }}
    </span>
  </CardFooter>
</template>
