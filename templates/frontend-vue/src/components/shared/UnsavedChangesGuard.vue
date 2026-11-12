<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue"
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router"
import type { RouteLocationNormalized } from "vue-router"
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

const props = defineProps<{ when: boolean }>()

const route = useRoute()
const router = useRouter()
const open = ref(false)
const pendingTarget = ref<RouteLocationNormalized | null>(null)
let allowNext = false

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!props.when) return
  event.preventDefault()
  event.returnValue = ""
}

onMounted(() => {
  window.addEventListener("beforeunload", handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload)
})

onBeforeRouteLeave((to) => {
  if (allowNext) {
    allowNext = false
    return true
  }
  // 同一页面的 tab / 查询参数变化不算离开
  if (!props.when || to.path === route.path) return true
  pendingTarget.value = to
  open.value = true
  return false
})

function proceed() {
  open.value = false
  const target = pendingTarget.value
  pendingTarget.value = null
  if (!target) return
  allowNext = true
  void router.push(target.fullPath)
}

function stay() {
  open.value = false
  pendingTarget.value = null
}
</script>

<template>
  <AlertDialog :open="open" @update:open="(value: boolean) => !value && stay()">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>放弃未保存的修改？</AlertDialogTitle>
        <AlertDialogDescription>
          当前页面还有未保存的内容，离开后这些修改会丢失。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="stay">留在本页</AlertDialogCancel>
        <AlertDialogAction @click="proceed">放弃修改</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
