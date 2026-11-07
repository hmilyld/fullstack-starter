<script setup lang="ts">
import LoadingButton from "@/components/shared/LoadingButton.vue"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    submitting?: boolean
    submitLabel?: string
    cancelLabel?: string
  }>(),
  {
    submitting: false,
    submitLabel: "保存",
    cancelLabel: "取消",
  }
)

const emit = defineEmits<{
  (e: "update:open", value: boolean): void
  (e: "submit", event: Event): void
}>()
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      :class="
        cn(
          'flex max-h-[calc(100dvh-var(--dialog-inset)*2)] flex-col gap-0 overflow-hidden p-0',
          $attrs.class
        )
      "
    >
      <form
        class="flex min-h-0 flex-1 flex-col"
        @submit.prevent="emit('submit', $event)"
      >
        <DialogHeader class="border-b p-4 pr-14 md:p-6 md:pr-14">
          <DialogTitle>{{ title }}</DialogTitle>
          <DialogDescription v-if="description || $slots.description">
            <slot name="description">{{ description }}</slot>
          </DialogDescription>
        </DialogHeader>
        <div
          class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6"
        >
          <slot />
        </div>
        <DialogFooter
          class="flex-row justify-end border-t bg-popover p-4 md:p-6"
        >
          <Button
            type="button"
            variant="outline"
            :disabled="submitting"
            @click="emit('update:open', false)"
          >
            {{ cancelLabel }}
          </Button>
          <LoadingButton type="submit" :loading="submitting">
            {{ submitLabel }}
          </LoadingButton>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
