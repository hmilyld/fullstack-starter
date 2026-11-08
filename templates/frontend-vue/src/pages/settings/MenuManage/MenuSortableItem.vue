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
  KeyRound,
  Pencil,
  Plus,
  Trash2,
} from "@lucide/vue"
import MenuIcon from "@/components/shared/MenuIcon.vue"
import RowActions from "@/components/shared/RowActions.vue"
import type { RowAction } from "@/components/shared/row-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  canReorder: boolean
  canEdit: boolean
  canDelete: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  canCreateOperation: boolean
  canEditOperation: boolean
  canDeleteOperation: boolean
  mutationsDisabled: boolean
  expanded: boolean
}>()

const emit = defineEmits<{
  (e: "edit", item: MenuItem): void
  (e: "delete", item: MenuItem): void
  (e: "move-up"): void
  (e: "move-down"): void
  (e: "toggle-expanded", permissionCode: string): void
  (e: "toggle-hidden", item: MenuItem): void
  (e: "add-operation", item: MenuItem): void
  (e: "edit-operation", item: MenuItem, operation: MenuOperation): void
  (e: "delete-operation", item: MenuItem, operation: MenuOperation): void
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
    result.push({
      label: "编辑",
      icon: Pencil,
      disabled: props.mutationsDisabled,
      onSelect: () => emit("edit", props.item),
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

function operationActions(operation: MenuOperation): RowAction[] {
  const result: RowAction[] = []
  if (props.canEditOperation) {
    result.push({
      label: "编辑",
      icon: Pencil,
      disabled: props.mutationsDisabled,
      onSelect: () => emit("edit-operation", props.item, operation),
    })
  }
  if (props.canDeleteOperation) {
    result.push({
      label: "删除",
      icon: Trash2,
      destructive: true,
      separatorBefore: true,
      disabled: props.mutationsDisabled,
      onSelect: () => emit("delete-operation", props.item, operation),
    })
  }
  return result
}

const panelId = computed(() => `operation-panel-${props.item.permissionCode}`)
</script>

<template>
  <div
    ref="element"
    :class="
      cn(
        'rounded-xl border bg-background',
        isDragging && 'relative z-10 opacity-70'
      )
    "
  >
    <div class="flex items-center justify-between gap-3 px-3 py-2">
      <div class="flex min-w-0 flex-1 items-center gap-2">
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
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <p class="truncate text-sm font-medium">{{ item.name }}</p>
            <Badge v-if="item.isSystem" variant="outline">内置</Badge>
            <Badge v-if="item.hidden" variant="secondary">已隐藏</Badge>
          </div>
          <p class="truncate text-xs text-muted-foreground">{{ item.route }}</p>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          class="max-md:h-11 max-md:w-11 max-md:px-0"
          :aria-expanded="expanded"
          :aria-controls="panelId"
          :aria-label="`${expanded ? '收起' : '展开'} ${item.name} 的操作权限`"
          @click="emit('toggle-expanded', item.permissionCode)"
        >
          <ChevronRight
            :class="cn('transition-transform', expanded && 'rotate-90')"
          />
          <span class="hidden md:inline">
            {{ item.operations.length }} 个操作
          </span>
        </Button>
        <RowActions :actions="actions" :label="`${item.name} 的操作`" />
      </div>
    </div>

    <div v-if="expanded" :id="panelId" class="border-t bg-muted/20 px-3 py-2">
      <div class="flex items-center justify-between gap-2 pb-1">
        <p class="text-xs font-medium text-muted-foreground">操作权限</p>
        <Button
          v-if="canCreateOperation"
          type="button"
          variant="ghost"
          size="xs"
          :disabled="mutationsDisabled"
          @click="emit('add-operation', item)"
        >
          <Plus data-icon="inline-start" />
          新增操作
        </Button>
      </div>
      <p
        v-if="item.operations.length === 0"
        class="px-1 py-2 text-xs text-muted-foreground"
      >
        还没有操作权限，添加后可在角色管理中分配。
      </p>
      <div v-else class="flex flex-col gap-1">
        <div
          v-for="operation in item.operations"
          :key="operation.code"
          class="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/60"
        >
          <div class="flex min-w-0 items-center gap-2">
            <KeyRound class="size-3.5 shrink-0 text-muted-foreground" />
            <span class="truncate text-sm">{{ operation.name }}</span>
            <Badge
              variant="secondary"
              class="font-mono text-[10px] max-md:hidden"
            >
              {{ operation.code }}
            </Badge>
          </div>
          <RowActions
            :actions="operationActions(operation)"
            :label="`${operation.name} 的操作`"
          />
        </div>
      </div>
    </div>
  </div>
</template>
