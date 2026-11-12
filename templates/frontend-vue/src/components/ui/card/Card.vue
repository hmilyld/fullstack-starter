<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"]
    size?: "default" | "sm"
  }>(),
  {
    size: "default",
  }
)
</script>

<template>
  <div
    data-slot="card"
    :data-size="size"
    :class="
      cn(
        'group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl border bg-card py-(--card-spacing) text-sm text-card-foreground shadow-sm [--card-spacing:--spacing(6)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl',
        props.class
      )
    "
  >
    <slot />
  </div>
</template>
