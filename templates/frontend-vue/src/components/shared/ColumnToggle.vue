<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
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

const { t } = useI18n()
const hideable = computed(() =>
  props.columns.filter((column) => column.hideable)
)
</script>

<template>
  <DropdownMenu v-if="hideable.length > 0">
    <DropdownMenuTrigger as-child>
      <Button variant="outline" :class="cn('w-full md:w-fit', props.class)">
        <Columns3 data-icon="inline-start" />
        {{ t("common.table.columns") }}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-44">
      <DropdownMenuLabel>{{ t("common.table.showColumns") }}</DropdownMenuLabel>
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
      <DropdownMenuItem @select="emit('reset')">{{
        t("common.table.resetColumns")
      }}</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
