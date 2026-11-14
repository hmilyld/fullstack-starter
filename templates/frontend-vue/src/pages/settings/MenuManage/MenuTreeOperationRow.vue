<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { KeyRound, Pencil, Trash2 } from "@lucide/vue"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableCell } from "@/components/ui/table"
import type { MenuItem, MenuOperation } from "@/types/menu"

defineProps<{
  item: MenuItem
  operation: MenuOperation
  canEdit: boolean
  canDelete: boolean
  mutationsDisabled: boolean
}>()

const emit = defineEmits<{
  (e: "edit", operation: MenuOperation): void
  (e: "delete", operation: MenuOperation): void
}>()

const { t } = useI18n()
</script>

<template>
  <tr class="border-b bg-muted/10 last:border-0 hover:bg-muted/20">
    <TableCell class="p-2">
      <div
        class="ml-10 flex min-w-0 items-center gap-2 border-l border-border/60 pl-3"
      >
        <KeyRound class="size-3.5 shrink-0 text-muted-foreground" />
        <div class="flex min-w-0 flex-col">
          <span class="truncate text-sm">{{ operation.name }}</span>
        </div>
      </div>
    </TableCell>
    <TableCell>
      <Badge variant="secondary">{{ t("menuPage.operationType") }}</Badge>
    </TableCell>
    <TableCell>
      <span class="truncate font-mono text-xs">{{ operation.code }}</span>
    </TableCell>
    <TableCell class="hidden text-muted-foreground lg:table-cell">
      —
    </TableCell>
    <TableCell class="sticky right-0 bg-inherit text-right">
      <div class="flex items-center justify-end gap-1">
        <Button
          v-if="canEdit"
          variant="ghost"
          size="icon-sm"
          :aria-label="
            t('menuPage.aria.editOperation', { name: operation.name })
          "
          :disabled="mutationsDisabled"
          @click="emit('edit', operation)"
        >
          <Pencil />
        </Button>
        <Button
          v-if="canDelete"
          variant="ghost"
          size="icon-sm"
          :aria-label="
            t('menuPage.aria.deleteOperation', { name: operation.name })
          "
          :disabled="mutationsDisabled"
          @click="emit('delete', operation)"
        >
          <Trash2 />
        </Button>
      </div>
    </TableCell>
  </tr>
</template>
