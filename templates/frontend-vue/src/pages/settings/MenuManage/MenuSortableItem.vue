<script setup lang="ts">
import { computed, ref } from "vue"
import { useSortable } from "@dnd-kit/vue/sortable"
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  Trash2,
} from "@lucide/vue"
import MenuIcon from "@/components/shared/MenuIcon.vue"
import RowActions from "@/components/shared/RowActions.vue"
import type { RowAction } from "@/components/shared/row-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { MenuItem } from "@/types/menu"
import {
  itemSortableId,
  type MenuDragData,
} from "@/pages/settings/MenuManage/menu-drag"

const props = defineProps<{
  item: MenuItem
  groupId: string
  index: number
  canReorder: boolean
  canEdit: boolean
  canDelete: boolean
  canMoveUp: boolean
  canMoveDown: boolean
}>()

const emit = defineEmits<{
  (e: "edit", item: MenuItem): void
  (e: "delete", item: MenuItem): void
  (e: "move-up"): void
  (e: "move-down"): void
}>()

const element = ref<HTMLElement | null>(null)
const handle = ref<HTMLElement | null>(null)

const { isDragging } = useSortable({
  id: itemSortableId(props.groupId, props.item.permissionCode),
  index: computed(() => props.index),
  element,
  handle,
  disabled: computed(() => !props.canReorder),
  data: computed<MenuDragData>(() => ({
    type: "item",
    groupId: props.groupId,
    index: props.index,
    permissionCode: props.item.permissionCode,
  })),
})

const actions = computed<RowAction[]>(() => {
  const result: RowAction[] = []
  if (props.canEdit) {
    result.push({
      label: "编辑",
      icon: Pencil,
      onSelect: () => emit("edit", props.item),
    })
  }
  if (props.canReorder) {
    result.push(
      {
        label: "上移",
        icon: ChevronUp,
        disabled: !props.canMoveUp,
        onSelect: () => emit("move-up"),
      },
      {
        label: "下移",
        icon: ChevronDown,
        disabled: !props.canMoveDown,
        onSelect: () => emit("move-down"),
      }
    )
  }
  if (props.canDelete && !props.item.isSystem) {
    result.push({
      label: "删除",
      icon: Trash2,
      destructive: true,
      separatorBefore: true,
      onSelect: () => emit("delete", props.item),
    })
  }
  return result
})
</script>

<template>
  <div
    ref="element"
    :class="
      cn(
        'flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-muted/60',
        isDragging && 'relative z-10 opacity-70'
      )
    "
  >
    <div class="flex min-w-0 items-center gap-3">
      <Button
        v-if="canReorder"
        ref="handle"
        variant="ghost"
        size="icon-xs"
        class="cursor-grab touch-none"
        :aria-label="`拖动 ${item.name} 排序`"
      >
        <GripVertical />
      </Button>
      <MenuIcon :name="item.icon" class="size-4 shrink-0" />
      <div class="min-w-0">
        <p class="truncate text-sm font-medium">{{ item.name }}</p>
        <p class="truncate text-xs text-muted-foreground">{{ item.route }}</p>
      </div>
      <Badge v-if="item.isSystem" variant="outline">内置</Badge>
    </div>
    <RowActions :actions="actions" :label="`${item.name} 的操作`" />
  </div>
</template>
