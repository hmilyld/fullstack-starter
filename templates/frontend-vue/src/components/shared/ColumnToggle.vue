<script setup lang="ts">
import { computed } from "vue"
import { Columns3 } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const props = defineProps<{
  columns: { key: string; header: string; hideable?: boolean }[]
  hidden: string[]
  class?: string
}>()

const emit = defineEmits<{
  (e: "toggle", key: string): void
  (e: "reset"): void
}>()

const hideable = computed(() =>
  props.columns.filter((column) => column.hideable)
)
</script>

<template>
  <DropdownMenu v-if="hideable.length > 0">
    <DropdownMenuTrigger as-child>
      <Button variant="outline" :class="cn('w-full md:w-fit', props.class)">
        <Columns3 data-icon="inline-start" />
        列
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-44">
      <DropdownMenuLabel>显示列</DropdownMenuLabel>
      <DropdownMenuCheckboxItem
        v-for="column in hideable"
        :key="column.key"
        :model-value="!hidden.includes(column.key)"
        @select.prevent
        @update:model-value="emit('toggle', column.key)"
      >
        {{ column.header }}
      </DropdownMenuCheckboxItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem @select="emit('reset')">恢复默认</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
