<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"]
    scope?: "col" | "colgroup" | "row" | "rowgroup"
  }>(),
  { scope: "col" }
)
</script>

<template>
  <th
    data-slot="table-head"
    :scope="props.scope"
    :class="
      cn(
        'h-11 px-4 text-left align-middle text-[13px] font-medium whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0',
        props.class
      )
    "
  >
    <slot />
  </th>
</template>
