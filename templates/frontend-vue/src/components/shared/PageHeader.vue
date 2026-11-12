<script setup lang="ts">
import { cn } from "@/lib/utils"

defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div
    :class="
      cn(
        'flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
        $attrs.class
      )
    "
  >
    <div class="flex flex-col gap-1">
      <h1
        class="font-heading text-2xl font-semibold tracking-tight text-balance"
      >
        {{ title }}
      </h1>
      <p
        v-if="description || $slots.description"
        class="text-sm text-pretty text-muted-foreground"
      >
        <slot name="description">{{ description }}</slot>
      </p>
    </div>
    <div
      v-if="$slots.actions"
      class="flex flex-col gap-2 md:flex-row md:items-center"
    >
      <slot name="actions" />
    </div>
  </div>
</template>
