<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"]
    /** 表头吸顶：桌面端容器不再横向滚动，交由列优先级控制宽度 */
    sticky?: boolean
  }>(),
  { sticky: false }
)
</script>

<template>
  <div
    data-slot="table-container"
    :class="
      cn(
        'relative w-full overflow-x-auto',
        props.sticky && 'md:overflow-x-visible'
      )
    "
  >
    <table
      data-slot="table"
      :class="cn('w-full caption-bottom text-sm', props.class)"
    >
      <slot />
    </table>
  </div>
</template>
