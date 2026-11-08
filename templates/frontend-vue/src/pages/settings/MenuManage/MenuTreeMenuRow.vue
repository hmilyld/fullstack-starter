<script setup lang="ts">
import { computed, ref } from "vue"
import { useSortable } from "@dnd-kit/vue/sortable"
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Eye,
  EyeOff,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "@lucide/vue"
import MenuIcon from "@/components/shared/MenuIcon.vue"
import RowActions from "@/components/shared/RowActions.vue"
import type { RowAction } from "@/components/shared/row-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableCell } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { MenuItem, MenuOperation } from "@/types/menu"
import {
  itemSortableId,
  type MenuDragData,
} from "@/pages/settings/MenuManage/menu-drag"

const props = defineProps<{
  item: MenuItem
  groupId: string
  index: number
  expanded: boolean
  canReorder: boolean
  canEdit: boolean
  canDelete: boolean
  canCreateOperation: boolean
  canEditOperation: boolean
  canDeleteOperation: boolean
  mutationsDisabled: boolean
  canMoveUp: boolean
  canMoveDown: boolean
}>()

const emit = defineEmits<{
  (e: "toggle"): void
  (e: "edit", item: MenuItem): void
  (e: "delete", item: MenuItem): void
  (e: "move-up"): void
  (e: "move-down"): void
  (e: "toggle-hidden", item: MenuItem): void
  (e: "add-operation", item: MenuItem): void
  (e: "edit-operation", operation: MenuOperation): void
  (e: "delete-operation", operation: MenuOperation): void
}>()

const element = ref<HTMLElement | null>(null)
const handle = ref<HTMLElement | null>(null)

const { isDragging } = useSortable({
  id: itemSortableId(props.groupId, props.item.permissionCode),
  index: computed(() => props.index),
  group: computed(() => props.groupId),
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
      label: props.item.hidden ? "在侧边栏显示" : "隐藏菜单",
      icon: props.item.hidden ? Eye : EyeOff,
      disabled: props.mutationsDisabled,
      onSelect: () => emit("toggle-hidden", props.item),
    })
  }
  if (props.canReorder) {
    result.push(
      {
        label: "上移",
        icon: ChevronUp,
        disabled: !props.canMoveUp || props.mutationsDisabled,
        onSelect: () => emit("move-up"),
      },
      {
        label: "下移",
        icon: ChevronDown,
        disabled: !props.canMoveDown || props.mutationsDisabled,
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
      disabled: props.mutationsDisabled,
      onSelect: () => emit("delete", props.item),
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
        'border-b transition-colors hover:bg-muted/50',
        isDragging && 'relative z-10 opacity-80'
      )
    "
  >
    <TableCell class="p-2">
      <div
        class="ml-4 flex min-w-0 items-center gap-1.5 border-l border-border/70 pl-3"
      >
        <Button
          variant="ghost"
          size="icon-xs"
          :aria-expanded="expanded"
          :aria-label="`${expanded ? '收起' : '展开'} ${item.name} 的操作权限`"
          @click="emit('toggle')"
        >
          <ChevronRight
            :class="cn('transition-transform', expanded && 'rotate-90')"
          />
        </Button>
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
        <div class="flex min-w-0 flex-col">
          <div class="flex min-w-0 items-center gap-1.5">
            <span class="truncate text-sm font-medium">{{ item.name }}</span>
            <Badge v-if="item.isSystem" variant="outline">内置</Badge>
            <Badge v-if="item.hidden" variant="secondary" class="lg:hidden">
              已隐藏
            </Badge>
            <span class="text-xs text-muted-foreground">
              {{ item.operations.length }} 个操作
            </span>
          </div>
        </div>
      </div>
    </TableCell>
    <TableCell>
      <Badge>菜单</Badge>
    </TableCell>
    <TableCell>
      <div class="flex min-w-0 flex-col">
        <span class="truncate text-sm">{{ item.route }}</span>
        <span class="truncate font-mono text-[11px] text-muted-foreground">
          {{ item.permissionCode }}
        </span>
      </div>
    </TableCell>
    <TableCell class="hidden lg:table-cell">
      <span
        :class="
          cn(
            'inline-flex items-center gap-1.5 text-xs',
            item.hidden ? 'text-warning' : 'text-muted-foreground'
          )
        "
      >
        <span
          :class="
            cn(
              'size-1.5 rounded-full',
              item.hidden ? 'bg-warning' : 'bg-muted-foreground'
            )
          "
        />
        {{ item.hidden ? "已隐藏" : "显示中" }}
      </span>
    </TableCell>
    <TableCell class="sticky right-0 bg-inherit text-right">
      <div class="flex items-center justify-end gap-1">
        <Button
          v-if="canCreateOperation"
          variant="ghost"
          size="icon-sm"
          :aria-label="`新增 ${item.name} 的操作权限`"
          :disabled="mutationsDisabled"
          @click="emit('add-operation', item)"
        >
          <Plus />
        </Button>
        <Button
          v-if="canEdit"
          variant="ghost"
          size="icon-sm"
          :aria-label="`编辑 ${item.name}`"
          :disabled="mutationsDisabled"
          @click="emit('edit', item)"
        >
          <Pencil />
        </Button>
        <RowActions :actions="actions" :label="`${item.name} 的操作`" />
      </div>
    </TableCell>
  </tr>
</template>
