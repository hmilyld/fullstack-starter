<script setup lang="ts">
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { MenuGroup, MenuItem, MenuOperation } from "@/types/menu"
import MenuTreeGroupRow from "@/pages/settings/MenuManage/MenuTreeGroupRow.vue"
import MenuTreeMenuRow from "@/pages/settings/MenuManage/MenuTreeMenuRow.vue"
import MenuTreeOperationRow from "@/pages/settings/MenuManage/MenuTreeOperationRow.vue"

defineProps<{
  groups: MenuGroup[]
  expanded: Set<string>
  collapsedGroups: Set<string>
  canReorder: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canCreateOperation: boolean
  canEditOperation: boolean
  canDeleteOperation: boolean
  mutationsDisabled: boolean
}>()

const emit = defineEmits<{
  (e: "toggle-group", groupId: string): void
  (e: "toggle-expanded", permissionCode: string): void
  (e: "create-item", groupId: string): void
  (e: "edit-group", group: MenuGroup): void
  (e: "delete-group", group: MenuGroup): void
  (e: "edit-item", item: MenuItem): void
  (e: "delete-item", item: MenuItem): void
  (e: "move-group", groupId: string, direction: -1 | 1): void
  (
    e: "move-item",
    groupId: string,
    permissionCode: string,
    direction: -1 | 1
  ): void
  (e: "toggle-hidden", item: MenuItem): void
  (e: "add-operation", item: MenuItem): void
  (e: "edit-operation", item: MenuItem, operation: MenuOperation): void
  (e: "delete-operation", item: MenuItem, operation: MenuOperation): void
}>()
</script>

<template>
  <Table class="min-w-[600px] table-fixed">
    <TableHeader>
      <TableRow class="bg-muted/50 hover:bg-muted/50">
        <TableHead class="w-[35%]">名称</TableHead>
        <TableHead class="w-[10%]">类型</TableHead>
        <TableHead class="w-[27%]">路由 / 权限编码</TableHead>
        <TableHead class="hidden w-[12%] lg:table-cell">标记</TableHead>
        <TableHead class="sticky right-0 w-[16%] bg-muted/50 text-right">
          操作
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <template v-for="(group, groupIndex) in groups" :key="group.id">
        <MenuTreeGroupRow
          :group="group"
          :index="groupIndex"
          :collapsed="collapsedGroups.has(group.id)"
          :can-reorder="canReorder"
          :can-create="canCreate"
          :can-edit="canEdit"
          :can-delete="canDelete"
          :mutations-disabled="mutationsDisabled"
          :can-move-up="groupIndex > 0"
          :can-move-down="groupIndex < groups.length - 1"
          @toggle="emit('toggle-group', group.id)"
          @create-item="emit('create-item', $event)"
          @edit="emit('edit-group', $event)"
          @delete="emit('delete-group', $event)"
          @move-up="emit('move-group', group.id, -1)"
          @move-down="emit('move-group', group.id, 1)"
        />

        <template v-if="!collapsedGroups.has(group.id)">
          <template
            v-for="(item, itemIndex) in group.items"
            :key="item.permissionCode"
          >
            <MenuTreeMenuRow
              :item="item"
              :group-id="group.id"
              :index="itemIndex"
              :expanded="expanded.has(item.permissionCode)"
              :can-reorder="canReorder"
              :can-edit="canEdit"
              :can-delete="canDelete"
              :can-create-operation="canCreateOperation"
              :can-edit-operation="canEditOperation"
              :can-delete-operation="canDeleteOperation"
              :mutations-disabled="mutationsDisabled"
              :can-move-up="itemIndex > 0"
              :can-move-down="itemIndex < group.items.length - 1"
              @toggle="emit('toggle-expanded', item.permissionCode)"
              @edit="emit('edit-item', $event)"
              @delete="emit('delete-item', $event)"
              @move-up="emit('move-item', group.id, item.permissionCode, -1)"
              @move-down="emit('move-item', group.id, item.permissionCode, 1)"
              @toggle-hidden="emit('toggle-hidden', $event)"
              @add-operation="emit('add-operation', $event)"
              @edit-operation="emit('edit-operation', item, $event)"
              @delete-operation="emit('delete-operation', item, $event)"
            />

            <template v-if="expanded.has(item.permissionCode)">
              <MenuTreeOperationRow
                v-for="operation in item.operations"
                :key="operation.code"
                :item="item"
                :operation="operation"
                :can-edit="canEditOperation"
                :can-delete="canDeleteOperation"
                :mutations-disabled="mutationsDisabled"
                @edit="emit('edit-operation', item, $event)"
                @delete="emit('delete-operation', item, $event)"
              />
            </template>
          </template>
        </template>
      </template>
    </TableBody>
  </Table>
</template>
