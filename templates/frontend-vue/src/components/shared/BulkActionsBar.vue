<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue"
import { X } from "@lucide/vue"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const props = defineProps<{
  count: number
  entityName: string
}>()

const emit = defineEmits<{ (e: "clear"): void }>()

const barRef = ref<HTMLElement | null>(null)
const announcement = ref("")
let timer: number | undefined

watch(
  () => [props.count, props.entityName],
  () => {
    window.clearTimeout(timer)
    if (props.count === 0) {
      announcement.value = ""
      return
    }
    announcement.value = `已选中 ${props.count} ${props.entityName}，批量操作可用`
    timer = window.setTimeout(() => {
      announcement.value = ""
    }, 3000)
  }
)

function isInsideOverlay(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(
    target.closest(
      '[role="dialog"], [data-slot="dropdown-menu-content"], [data-slot="select-content"]'
    )
  )
}

function handleWindowKeyDown(event: KeyboardEvent) {
  if (event.key !== "Escape" || props.count === 0) return
  if (isInsideOverlay(event.target)) return
  emit("clear")
}

function handleBarKeyDown(event: KeyboardEvent) {
  if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return
  const buttons = Array.from(
    barRef.value?.querySelectorAll<HTMLButtonElement>("button") ?? []
  ).filter((button) => !button.disabled)
  if (buttons.length === 0) return

  event.preventDefault()
  const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
  let next = 0
  if (event.key === "ArrowRight") next = (current + 1) % buttons.length
  else if (event.key === "ArrowLeft")
    next = current <= 0 ? buttons.length - 1 : current - 1
  else if (event.key === "End") next = buttons.length - 1
  buttons[next]?.focus()
}

onMounted(() => window.addEventListener("keydown", handleWindowKeyDown))
onUnmounted(() => {
  window.removeEventListener("keydown", handleWindowKeyDown)
  window.clearTimeout(timer)
})
</script>

<template>
  <Teleport to="body">
    <div aria-live="polite" aria-atomic="true" class="sr-only">
      {{ announcement }}
    </div>
    <div
      v-if="count > 0"
      ref="barRef"
      role="toolbar"
      :aria-label="`批量操作，已选 ${count} ${entityName}`"
      tabindex="-1"
      class="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 pb-[env(safe-area-inset-bottom)] md:bottom-6"
      @keydown="handleBarKeyDown"
    >
      <div
        class="flex animate-in items-center gap-2 rounded-xl border bg-background/95 p-1.5 shadow-xl backdrop-blur-lg duration-200 ease-out fade-in-0 slide-in-from-bottom-2 supports-[backdrop-filter]:bg-background/70"
      >
        <Button
          variant="ghost"
          size="icon-xs"
          class="rounded-full"
          aria-label="清除选择"
          title="清除选择（Esc）"
          @click="emit('clear')"
        >
          <X />
        </Button>
        <Separator orientation="vertical" class="h-5" aria-hidden="true" />
        <span class="flex items-center gap-1.5 text-sm whitespace-nowrap">
          <Badge class="min-w-6 justify-center rounded-md px-1.5 tabular-nums">
            {{ count }}
          </Badge>
          <span class="text-muted-foreground">{{ entityName }}</span>
        </span>
        <template v-if="$slots.default">
          <Separator orientation="vertical" class="h-5" aria-hidden="true" />
          <slot />
        </template>
      </div>
    </div>
  </Teleport>
</template>
