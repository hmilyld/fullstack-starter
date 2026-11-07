<script setup lang="ts">
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
</script>

<template>
  <AlertDialog :open="open" @update:open="emit('update:open', $event)">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>确认删除</AlertDialogTitle>
        <AlertDialogDescription>
          确定要删除
          <span class="font-medium text-foreground">{{ targetName }}</span>
          吗？此操作不可撤销。
          <template v-if="description"> {{ description }}</template>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>取消</AlertDialogCancel>
        <AlertDialogAction
          variant="destructive"
          :disabled="loading"
          @click.prevent="emit('confirm')"
        >
          <Spinner v-if="loading" data-icon="inline-start" />
          删除
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
