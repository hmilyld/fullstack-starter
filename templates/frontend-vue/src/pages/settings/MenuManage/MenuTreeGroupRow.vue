<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useDroppable } from "@dnd-kit/vue"
import { useSortable } from "@dnd-kit/vue/sortable"
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "@lucide/vue"
import RowActions from "@/components/shared/RowActions.vue"
import type { RowAction } from "@/components/shared/row-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableCell } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { MenuGroup } from "@/types/menu"
import { translateOr } from "@/lib/label"
import {
  groupSortableId,
  type MenuDragData,
} from "@/pages/settings/MenuManage/menu-drag"

const props = defineProps<{
  group: MenuGroup
  index: number
  collapsed: boolean
  canReorder: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  mutationsDisabled: boolean
  canMoveUp: boolean
  canMoveDown: boolean
}>()

const emit = defineEmits<{
  (e: "toggle"): void
  (e: "create-item", groupId: string): void
  (e: "edit", group: MenuGroup): void
  (e: "delete", group: MenuGroup): void
  (e: "move-up"): void
  (e: "move-down"): void
}>()

const { t } = useI18n()
const label = computed(() =>
  props.group.isSystem
    ? translateOr(`nav.groups.${props.group.id}`, props.group.name)
    : props.group.name
)
const element = ref<HTMLElement | null>(null)
const handle = ref<HTMLElement | null>(null)
const dropElement = ref<HTMLElement | null>(null)

const { isDragging } = useSortable({
  id: groupSortableId(props.group.id),
  index: computed(() => props.index),
  element,
  handle,
  disabled: computed(() => !props.canReorder),
  data: computed<MenuDragData>(() => ({
    type: "group",
    groupId: props.group.id,
    index: props.index,
  })),
})

const { isDropTarget } = useDroppable({
  id: `drop:${props.group.id}`,
  element: dropElement,
  data: computed<MenuDragData>(() => ({
    type: "group-drop",
    groupId: props.group.id,
    index: props.group.items.length,
  })),
})

const actions = computed<RowAction[]>(() => {
  const result: RowAction[] = []
  if (props.canReorder) {
    result.push(
      {
        label: t("menuPage.actions.moveUpGroup"),
        icon: ChevronUp,
        disabled: !props.canMoveUp || props.mutationsDisabled,
        onSelect: () => emit("move-up"),
      },
      {
        label: t("menuPage.actions.moveDownGroup"),
        icon: ChevronDown,
        disabled: !props.canMoveDown || props.mutationsDisabled,
        onSelect: () => emit("move-down"),
      }
    )
  }
  if (props.canDelete && !props.group.isSystem) {
    result.push({
      label: t("menuPage.actions.deleteGroup"),
      icon: Trash2,
      destructive: true,
      separatorBefore: true,
      disabled: props.mutationsDisabled,
      onSelect: () => emit("delete", props.group),
    })
  }
  return result
})
</script>

<template>
  <tr
    ref="element"
    :class="
      cn(
        'border-b bg-muted/40 transition-colors hover:bg-muted/60',
        isDragging && 'relative z-10 opacity-80',
        isDropTarget && 'bg-muted/70'
      )
    "
  >
    <TableCell class="p-2">
      <div ref="dropElement" class="flex min-w-0 items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon-xs"
          :aria-expanded="!collapsed"
          :aria-label="
            collapsed
              ? t('menuPage.aria.toggleGroup', {
                  action: t('menuPage.actions.expand'),
                  name: label,
                })
              : t('menuPage.aria.toggleGroup', {
                  action: t('menuPage.actions.collapse'),
                  name: label,
                })
          "
          @click="emit('toggle')"
        >
          <ChevronRight
            :class="cn('transition-transform', !collapsed && 'rotate-90')"
          />
        </Button>
        <Button
          v-if="canReorder"
          ref="handle"
          variant="ghost"
          size="icon-xs"
          class="cursor-grab touch-none"
          :aria-label="t('menuPage.aria.dragGroup', { name: label })"
        >
          <GripVertical />
        </Button>
        <span class="truncate text-sm font-medium">{{ label }}</span>
        <Badge v-if="group.isSystem" variant="outline">{{
          t("menuPage.builtIn")
        }}</Badge>
        <span class="text-xs text-muted-foreground">
          {{ t("menuPage.itemCount", { count: group.items.length }) }}
        </span>
      </div>
    </TableCell>
    <TableCell>
      <Badge variant="outline">{{ t("menuPage.groupType") }}</Badge>
    </TableCell>
    <TableCell class="text-muted-foreground">—</TableCell>
    <TableCell class="hidden text-muted-foreground lg:table-cell">
      —
    </TableCell>
    <TableCell class="sticky right-0 bg-inherit text-right">
      <div class="flex items-center justify-end gap-1">
        <Button
          v-if="canCreate"
          variant="ghost"
          size="icon-sm"
          :aria-label="t('menuPage.aria.addMenuUnder', { name: label })"
          :disabled="mutationsDisabled"
          @click="emit('create-item', group.id)"
        >
          <Plus />
        </Button>
        <Button
          v-if="canEdit"
          variant="ghost"
          size="icon-sm"
          :aria-label="t('menuPage.aria.editGroup', { name: label })"
          :disabled="mutationsDisabled"
          @click="emit('edit', group)"
        >
          <Pencil />
        </Button>
        <RowActions
          :actions="actions"
          :label="t('menuPage.groupActions', { name: label })"
        />
      </div>
    </TableCell>
  </tr>
</template>
