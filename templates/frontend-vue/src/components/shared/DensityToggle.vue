<script setup lang="ts">
import { useI18n } from "vue-i18n"
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
const { t } = useI18n()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="outline"
        size="icon-sm"
        :aria-label="t('common.table.density')"
        :title="t('common.table.density')"
        :class="triggerClass"
      >
        <Rows3 />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-36">
      <DropdownMenuLabel>{{ t("common.table.density") }}</DropdownMenuLabel>
      <DropdownMenuItem @select="emit('change', 'comfortable')">
        <span class="flex size-4 items-center justify-center">
          <Check v-if="density === 'comfortable'" class="size-4" />
        </span>
        {{ t("common.table.comfortable") }}
      </DropdownMenuItem>
      <DropdownMenuItem @select="emit('change', 'compact')">
        <span class="flex size-4 items-center justify-center">
          <Check v-if="density === 'compact'" class="size-4" />
        </span>
        {{ t("common.table.compact") }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
