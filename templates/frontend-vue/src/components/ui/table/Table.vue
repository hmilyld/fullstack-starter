<script setup lang="ts">
import { computed, type HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"]
    /** 表头吸顶：桌面端容器不再横向滚动，交由列优先级控制宽度 */
    sticky?: boolean
    /** 表格的无障碍名称，同时用作 sr-only caption 与滚动区域的 aria-label */
    label?: string
    /** 容器是否可能横向滚动；为 true 且提供了 label 时，容器可被键盘聚焦 */
    scrollable?: boolean
  }>(),
  { sticky: false, scrollable: true }
)

// 滚动的表格必须能接收键盘焦点，否则键盘用户无法横向滚动（WCAG 2.1.1）
const namedRegion = computed(() => props.scrollable && Boolean(props.label))
</script>

<template>
  <div
    data-slot="table-container"
    :role="namedRegion ? 'region' : undefined"
    :aria-label="namedRegion ? props.label : undefined"
    :tabindex="namedRegion ? 0 : undefined"
    :class="
      cn(
        'relative w-full overflow-x-auto',
        props.sticky && 'md:overflow-x-visible',
        namedRegion && 'focus-visible:ring-2 focus-visible:ring-ring'
      )
    "
  >
    <table
      data-slot="table"
      :class="cn('w-full caption-bottom text-sm', props.class)"
    >
      <caption v-if="props.label" class="sr-only" v-text="props.label" />
      <slot />
    </table>
  </div>
</template>
