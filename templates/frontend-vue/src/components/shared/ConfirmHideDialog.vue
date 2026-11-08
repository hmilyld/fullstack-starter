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
        <AlertDialogTitle>确认隐藏菜单</AlertDialogTitle>
        <AlertDialogDescription>
          隐藏
          <span class="font-medium text-foreground">{{ targetName }}</span>
          后，侧边栏将不再显示该入口。如果这是「菜单与权限」或「系统设置」入口，你仍可通过
          /settings/menu 直接访问并重新显示。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>取消</AlertDialogCancel>
        <AlertDialogAction :disabled="loading" @click.prevent="emit('confirm')">
          <Spinner v-if="loading" data-icon="inline-start" />
          隐藏
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
