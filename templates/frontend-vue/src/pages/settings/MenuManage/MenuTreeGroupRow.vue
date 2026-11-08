<script setup lang="ts">
import { computed, ref } from "vue"
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
          :aria-label="`${collapsed ? '展开' : '收起'} ${group.name} 分组`"
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
          :aria-label="`拖动 ${group.name} 分组排序`"
        >
          <GripVertical />
        </Button>
        <span class="truncate text-sm font-medium">{{ group.name }}</span>
        <Badge v-if="group.isSystem" variant="outline">内置</Badge>
        <span class="text-xs text-muted-foreground">
          {{ group.items.length }} 个菜单
        </span>
      </div>
    </TableCell>
    <TableCell>
      <Badge variant="outline">分组</Badge>
    </TableCell>
    <TableCell class="text-muted-foreground">—</TableCell>
    <TableCell class="text-muted-foreground">—</TableCell>
    <TableCell class="sticky right-0 bg-inherit text-right">
      <div class="flex items-center justify-end gap-1">
        <Button
          v-if="canCreate"
          variant="ghost"
          size="icon-sm"
          :aria-label="`在 ${group.name} 下新增菜单`"
          :disabled="mutationsDisabled"
          @click="emit('create-item', group.id)"
        >
          <Plus />
        </Button>
        <Button
          v-if="canEdit"
          variant="ghost"
          size="icon-sm"
          :aria-label="`编辑 ${group.name} 分组`"
          :disabled="mutationsDisabled"
          @click="emit('edit', group)"
        >
          <Pencil />
        </Button>
        <RowActions :actions="actions" :label="`${group.name} 分组的操作`" />
      </div>
    </TableCell>
  </tr>
</template>
