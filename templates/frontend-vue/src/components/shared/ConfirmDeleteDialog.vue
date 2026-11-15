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
    description?: string
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
        <AlertDialogTitle>{{
          t("common.confirmDelete.title")
        }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ t("common.confirmDelete.prefix") }}
          <span class="font-medium text-foreground">{{ targetName }}</span>
          {{ t("common.confirmDelete.suffix") }}
          <template v-if="description"> {{ description }}</template>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{{
          t("common.confirmDelete.cancel")
        }}</AlertDialogCancel>
        <AlertDialogAction
          variant="destructive"
          :disabled="loading"
          @click.prevent="emit('confirm')"
        >
          <Spinner v-if="loading" data-icon="inline-start" />
          {{ t("common.confirmDelete.confirm") }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
