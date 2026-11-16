<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Spinner } from "@/components/ui/spinner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

withDefaults(
  defineProps<{
    open: boolean
    targetName: string
    loading?: boolean
  }>(),
  {
    loading: false,
  }
)

const emit = defineEmits<{
  (e: "update:open", value: boolean): void
  (e: "confirm"): void
}>()

const { t } = useI18n()
</script>

<template>
  <AlertDialog :open="open" @update:open="emit('update:open', $event)">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t("common.confirmHide.title") }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ t("common.confirmHide.prefix") }}
          <span class="font-medium text-foreground">{{ targetName }}</span>
          {{ t("common.confirmHide.suffix") }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{{
          t("common.confirmHide.cancel")
        }}</AlertDialogCancel>
        <AlertDialogAction
          :disabled="loading"
          :aria-busy="loading"
          @click.prevent="emit('confirm')"
        >
          <Spinner v-if="loading" data-icon="inline-start" decorative />
          {{ t("common.confirmHide.confirm") }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
