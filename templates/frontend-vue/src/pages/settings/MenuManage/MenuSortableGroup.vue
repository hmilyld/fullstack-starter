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
import type { MenuGroup, MenuItem, MenuOperation } from "@/types/menu"
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
  canCreateOperation: boolean
  canEditOperation: boolean
  canDeleteOperation: boolean
  mutationsDisabled: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  expanded: Set<string>
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
  (e: "toggle-expanded", permissionCode: string): void
  (e: "toggle-hidden", item: MenuItem): void
  (e: "add-operation", item: MenuItem): void
  (e: "edit-operation", item: MenuItem, operation: MenuOperation): void
  (e: "delete-operation", item: MenuItem, operation: MenuOperation): void
}>()

function handleEditOperation(item: MenuItem, operation: MenuOperation) {
  emit("edit-operation", item, operation)
}

function handleDeleteOperation(item: MenuItem, operation: MenuOperation) {
  emit("delete-operation", item, operation)
}

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
      disabled: props.mutationsDisabled,
      onSelect: () => emit("edit-group", props.group),
    })
  }
  if (props.canReorder) {
    result.push(
      {
        label: "上移分组",
        icon: ChevronUp,
        disabled: !props.canMoveUp || props.mutationsDisabled,
        onSelect: () => emit("move-up"),
      },
      {
        label: "下移分组",
        icon: ChevronDown,
        disabled: !props.canMoveDown || props.mutationsDisabled,
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
      disabled: props.mutationsDisabled,
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
              :disabled="mutationsDisabled"
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
          :can-create-operation="canCreateOperation"
          :can-edit-operation="canEditOperation"
          :can-delete-operation="canDeleteOperation"
          :mutations-disabled="mutationsDisabled"
          :expanded="expanded.has(item.permissionCode)"
          :can-move-up="itemIndex > 0"
          :can-move-down="itemIndex < group.items.length - 1"
          @edit="emit('edit-item', $event)"
          @delete="emit('delete-item', $event)"
          @move-up="emit('move-item', group.id, item.permissionCode, -1)"
          @move-down="emit('move-item', group.id, item.permissionCode, 1)"
          @toggle-expanded="emit('toggle-expanded', $event)"
          @toggle-hidden="emit('toggle-hidden', $event)"
          @add-operation="emit('add-operation', $event)"
          @edit-operation="handleEditOperation"
          @delete-operation="handleDeleteOperation"
        />
        <div
          v-if="group.items.length === 0"
          ref="dropElement"
          :class="
            cn(
              'rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground',
              isDropTarget && 'bg-muted/40'
            )
          "
        >
          暂无菜单
        </div>
        <div
          v-else
          ref="dropElement"
          aria-hidden="true"
          :class="cn('h-4 rounded-lg', isDropTarget && 'bg-muted/40')"
        />
      </CardContent>
    </Card>
  </div>
</template>
