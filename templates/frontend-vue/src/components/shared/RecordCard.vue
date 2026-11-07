<script setup lang="ts">
import { cn } from "@/lib/utils"

defineProps<{
  title?: string
  subtitle?: string
}>()
</script>

<template>
  <div
    :class="
      cn(
        'flex items-start justify-between gap-3 rounded-2xl border bg-card p-4',
        $attrs.class
      )
    "
  >
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <div class="flex min-w-0 flex-wrap items-center gap-2">
        <span class="min-w-0 truncate text-sm font-medium">
          <slot name="title">{{ title }}</slot>
        </span>
        <slot name="badges" />
      </div>
      <span
        v-if="subtitle || $slots.subtitle"
        class="truncate text-sm text-muted-foreground"
      >
        <slot name="subtitle">{{ subtitle }}</slot>
      </span>
      <div
        v-if="$slots.meta"
        class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
      >
        <slot name="meta" />
      </div>
    </div>
    <div v-if="$slots.actions" class="shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>
