<script setup lang="ts">
import { MoreHorizontal } from "@lucide/vue"
import type { RowAction } from "@/components/shared/row-action"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const props = withDefaults(
  defineProps<{
    actions: RowAction[]
    label?: string
  }>(),
  {
    label: "更多操作",
  }
)
</script>

<template>
  <DropdownMenu v-if="props.actions.length > 0">
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon-sm" :aria-label="props.label">
        <MoreHorizontal />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-44">
      <DropdownMenuLabel>操作</DropdownMenuLabel>
      <DropdownMenuGroup>
        <template v-for="(action, index) in props.actions" :key="action.label">
          <DropdownMenuSeparator v-if="action.separatorBefore && index > 0" />
          <DropdownMenuItem
            :variant="action.destructive ? 'destructive' : 'default'"
            :disabled="action.disabled"
            @select="action.onSelect"
          >
            <component :is="action.icon" v-if="action.icon" />
            {{ action.label }}
          </DropdownMenuItem>
        </template>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
