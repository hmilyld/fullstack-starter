<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
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

const props = defineProps<{
  actions: RowAction[]
  label?: string
}>()

const { t } = useI18n()
const triggerLabel = computed(() => props.label ?? t("common.moreActions"))
</script>

<template>
  <DropdownMenu v-if="props.actions.length > 0">
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon-sm" :aria-label="triggerLabel">
        <MoreHorizontal />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-44">
      <DropdownMenuLabel>{{ t("common.actions") }}</DropdownMenuLabel>
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
