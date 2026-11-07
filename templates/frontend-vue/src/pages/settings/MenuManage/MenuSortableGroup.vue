<script setup lang="ts">
import { computed, ref } from "vue"
import { useDroppable } from "@dnd-kit/vue"
import { useSortable } from "@dnd-kit/vue/sortable"
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "@lucide/vue"
import RowActions from "@/components/shared/RowActions.vue"
import type { RowAction } from "@/components/shared/row-action"
import MenuSortableItem from "@/pages/settings/MenuManage/MenuSortableItem.vue"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { MenuGroup, MenuItem } from "@/types/menu"
import {
  groupSortableId,
  type MenuDragData,
} from "@/pages/settings/MenuManage/menu-drag"

const props = defineProps<{
  group: MenuGroup
  index: number
  canReorder: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canMoveUp: boolean
  canMoveDown: boolean
}>()

const emit = defineEmits<{
  (e: "create-item", groupId: string): void
  (e: "edit-group", group: MenuGroup): void
  (e: "delete-group", group: MenuGroup): void
  (e: "edit-item", item: MenuItem): void
  (e: "delete-item", item: MenuItem): void
  (e: "move-up"): void
  (e: "move-down"): void
  (
    e: "move-item",
    groupId: string,
    permissionCode: string,
    direction: -1 | 1
  ): void
}>()

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
  if (props.canEdit) {
    result.push({
      label: "编辑分组",
      icon: Pencil,
      onSelect: () => emit("edit-group", props.group),
    })
  }
  if (props.canReorder) {
    result.push(
      {
        label: "上移分组",
        icon: ChevronUp,
        disabled: !props.canMoveUp,
        onSelect: () => emit("move-up"),
      },
      {
        label: "下移分组",
        icon: ChevronDown,
        disabled: !props.canMoveDown,
        onSelect: () => emit("move-down"),
      }
    )
  }
  if (props.canDelete && !props.group.isSystem) {
    result.push({
      label: "删除分组",
      icon: Trash2,
      destructive: true,
      separatorBefore: true,
      onSelect: () => emit("delete-group", props.group),
    })
  }
  return result
})
</script>

<template>
  <div ref="element" :class="cn(isDragging && 'relative z-10 opacity-70')">
    <Card>
      <CardHeader class="border-b">
        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-2">
            <Button
              v-if="canReorder"
              ref="handle"
              variant="ghost"
              size="icon-xs"
              class="cursor-grab touch-none"
              :aria-label="`拖动 ${group.name} 分组排序`"
            >
              <GripVertical />
            </Button>
            <CardTitle class="truncate">{{ group.name }}</CardTitle>
            <Badge v-if="group.isSystem" variant="outline">内置</Badge>
          </div>
          <div class="flex items-center gap-1">
            <Button
              v-if="canCreate"
              variant="ghost"
              size="sm"
              class="max-md:w-8 max-md:px-0"
              aria-label="新增菜单"
              @click="emit('create-item', group.id)"
            >
              <Plus data-icon="inline-start" />
              <span class="hidden md:inline">新增菜单</span>
            </Button>
            <RowActions
              :actions="actions"
              :label="`${group.name} 分组的操作`"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent
        ref="dropElement"
        :class="
          cn(
            'flex flex-col gap-1 p-2 transition-colors',
            isDropTarget && 'bg-muted/40'
          )
        "
      >
        <MenuSortableItem
          v-for="(item, itemIndex) in group.items"
          :key="item.permissionCode"
          :item="item"
          :group-id="group.id"
          :index="itemIndex"
          :can-reorder="canReorder"
          :can-edit="canEdit"
          :can-delete="canDelete"
          :can-move-up="itemIndex > 0"
          :can-move-down="itemIndex < group.items.length - 1"
          @edit="emit('edit-item', $event)"
          @delete="emit('delete-item', $event)"
          @move-up="emit('move-item', group.id, item.permissionCode, -1)"
          @move-down="emit('move-item', group.id, item.permissionCode, 1)"
        />
        <div
          v-if="group.items.length === 0"
          class="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
        >
          暂无菜单
        </div>
      </CardContent>
    </Card>
  </div>
</template>
