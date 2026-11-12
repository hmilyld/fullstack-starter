<script setup lang="ts">
import { Check, Rows3 } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TableDensity } from "@/composables/use-table-density"

defineProps<{
  density: TableDensity
  triggerClass?: string
}>()

const emit = defineEmits<{ (e: "change", density: TableDensity): void }>()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="表格密度"
        title="表格密度"
        :class="triggerClass"
      >
        <Rows3 />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-36">
      <DropdownMenuLabel>表格密度</DropdownMenuLabel>
      <DropdownMenuItem @select="emit('change', 'comfortable')">
        <span class="flex size-4 items-center justify-center">
          <Check v-if="density === 'comfortable'" class="size-4" />
        </span>
        舒适
      </DropdownMenuItem>
      <DropdownMenuItem @select="emit('change', 'compact')">
        <span class="flex size-4 items-center justify-center">
          <Check v-if="density === 'compact'" class="size-4" />
        </span>
        紧凑
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
