<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"]
    size?: "default" | "sm"
    /** plain：用于设置页等扁平分区，去掉边框/底色/内边距 */
    variant?: "default" | "plain"
  }>(),
  {
    size: "default",
    variant: "default",
  }
)
</script>

<template>
  <div
    data-slot="card"
    :data-size="size"
    :data-variant="variant"
    :class="
      cn(
        'group/card flex flex-col gap-(--card-spacing) overflow-clip rounded-xl border bg-card py-(--card-spacing) text-sm text-card-foreground shadow-sm [--card-spacing:--spacing(6)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl',
        variant === 'plain' &&
          'gap-5 overflow-visible border-0 bg-transparent py-0 shadow-none [--card-spacing:0px] [&_[data-slot=card-title]]:text-lg [&>[data-slot=card-header]]:border-b [&>[data-slot=card-header]]:pb-4',
        props.class
      )
    "
  >
    <slot />
  </div>
</template>
