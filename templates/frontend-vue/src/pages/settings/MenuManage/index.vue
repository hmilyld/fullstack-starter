<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/vue"
import { isSortable } from "@dnd-kit/vue/sortable"
import { Plus, Save } from "@lucide/vue"
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog.vue"
import EmptyState from "@/components/shared/EmptyState.vue"
import FormDialog from "@/components/shared/FormDialog.vue"
import IconPicker from "@/components/shared/IconPicker.vue"
import LoadingButton from "@/components/shared/LoadingButton.vue"
import PageFormSkeleton from "@/components/shared/PageFormSkeleton.vue"
import PageHeader from "@/components/shared/PageHeader.vue"
import MenuSortableGroup from "@/pages/settings/MenuManage/MenuSortableGroup.vue"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createMenuGroup,
  createMenuItem,
  deleteMenuGroup,
  deleteMenuItem,
  getMenuConfig,
  saveMenuLayout,
  updateMenuGroup,
  updateMenuItem,
} from "@/api/menu"
import { useAuthStore } from "@/stores/auth"
import { useToast } from "@/composables/use-toast"
import type { MenuConfig, MenuGroup, MenuItem } from "@/types/menu"
import type { MenuDragData } from "@/pages/settings/MenuManage/menu-drag"

const NAVIGATION_REFRESH_EVENT = "navigation-refresh"

type DeleteTarget =
  | { type: "group"; id: string; name: string }
  | { type: "item"; id: string; name: string }
  | null

const auth = useAuthStore()
const toast = useToast()

const config = ref<MenuConfig | null>(null)
const savedConfig = ref<MenuConfig | null>(null)
const loading = ref(true)
const saving = ref(false)
const submitting = ref(false)

const groupOpen = ref(false)
const editingGroup = ref<MenuGroup | null>(null)
const groupName = ref("")

const itemOpen = ref(false)
const editingItem = ref<MenuItem | null>(null)
const itemForm = ref({
  permissionCode: "",
  name: "",
  groupId: "",
  route: "",
  icon: "circle",
})

const deleteTarget = ref<DeleteTarget>(null)
const deleteLoading = ref(false)
const dragEpoch = ref(0)

const canReorder = computed(() => auth.hasPermission("menus.reorder"))
const canCreate = computed(() => auth.hasPermission("menus.create"))
const canEdit = computed(() => auth.hasPermission("menus.edit"))
const canDelete = computed(() => auth.hasPermission("menus.delete"))

function cloneConfig(value: MenuConfig): MenuConfig {
  return {
    version: value.version,
    groups: value.groups.map((group) => ({
      ...group,
      items: group.items.map((item) => ({ ...item })),
    })),
  }
}

function normalize(value: MenuConfig): MenuConfig {
  return {
    ...value,
    groups: value.groups.map((group, groupIndex) => ({
      ...group,
      sortOrder: groupIndex + 1,
      items: group.items.map((item, itemIndex) => ({
        ...item,
        groupId: group.id,
        sortOrder: itemIndex + 1,
      })),
    })),
  }
}

async function load() {
  loading.value = true
  const response = await getMenuConfig()
  if (response.code === 0) {
    config.value = cloneConfig(response.data)
    savedConfig.value = cloneConfig(response.data)
  } else {
    toast.error(response.message || "加载菜单失败")
  }
  loading.value = false
}

onMounted(() => {
  void load()
})

const dirty = computed(
  () =>
    config.value !== null &&
    savedConfig.value !== null &&
    JSON.stringify(config.value) !== JSON.stringify(savedConfig.value)
)

function updateDraft(updater: (current: MenuConfig) => MenuConfig) {
  if (!config.value) return
  config.value = normalize(updater(cloneConfig(config.value)))
}

function arrayMove<T>(items: T[], from: number, to: number) {
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

function moveGroup(groupId: string, direction: -1 | 1) {
  updateDraft((current) => {
    const index = current.groups.findIndex((group) => group.id === groupId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= current.groups.length) {
      return current
    }
    return { ...current, groups: arrayMove(current.groups, index, target) }
  })
}

function moveItem(groupId: string, permissionCode: string, direction: -1 | 1) {
  updateDraft((current) => {
    const group = current.groups.find((item) => item.id === groupId)
    if (!group) return current
    const index = group.items.findIndex(
      (item) => item.permissionCode === permissionCode
    )
    const target = index + direction
    if (index < 0 || target < 0 || target >= group.items.length) {
      return current
    }
    return {
      ...current,
      groups: current.groups.map((item) =>
        item.id === groupId
          ? { ...item, items: arrayMove(item.items, index, target) }
          : item
      ),
    }
  })
}

function handleDragEnd(event: DragEndEvent) {
  if (event.canceled) return
  const source = event.operation.source
  if (!source || !isSortable(source)) return

  const sourceData = source.data as MenuDragData | undefined
  if (!sourceData) return

  const before = config.value ? JSON.stringify(config.value) : ""
  const initialIndex = source.initialIndex
  const nextIndex = source.index
  const targetData = event.operation.target?.data as MenuDragData | undefined
  const sourceGroupId =
    (source.initialGroup as string | undefined) ?? sourceData.groupId
  const targetGroupId =
    (source.group as string | undefined) ?? targetData?.groupId ?? sourceGroupId
  const nextGroupIndex =
    targetGroupId !== sourceGroupId && targetData ? targetData.index : nextIndex

  if (sourceData.type === "group") {
    if (initialIndex !== nextIndex) {
      updateDraft((current) => ({
        ...current,
        groups: arrayMove(current.groups, initialIndex, nextIndex),
      }))
    }
  } else if (sourceData.type === "item") {
    updateDraft((current) => {
      const sourceGroup = current.groups.find(
        (group) => group.id === sourceGroupId
      )
      const targetGroup = current.groups.find(
        (group) => group.id === targetGroupId
      )
      if (!sourceGroup || !targetGroup) return current

      const item = sourceGroup.items.find(
        (candidate) => candidate.permissionCode === sourceData.permissionCode
      )
      if (!item) return current

      if (sourceGroup.id === targetGroup.id) {
        if (initialIndex === nextIndex) return current
        return {
          ...current,
          groups: current.groups.map((group) =>
            group.id === sourceGroup.id
              ? {
                  ...group,
                  items: arrayMove(group.items, initialIndex, nextGroupIndex),
                }
              : group
          ),
        }
      }

      return {
        ...current,
        groups: current.groups.map((group) => {
          if (group.id === sourceGroup.id) {
            return {
              ...group,
              items: group.items.filter(
                (candidate) =>
                  candidate.permissionCode !== sourceData.permissionCode
              ),
            }
          }
          if (group.id === targetGroup.id) {
            const items = [...group.items]
            const targetIndex =
              nextGroupIndex < 0 ? items.length : nextGroupIndex
            items.splice(targetIndex, 0, item)
            return { ...group, items }
          }
          return group
        }),
      }
    })
  }

  const after = config.value ? JSON.stringify(config.value) : ""
  if (before === after) dragEpoch.value += 1
}

async function handleSave() {
  if (!config.value || !dirty.value) return
  saving.value = true
  const response = await saveMenuLayout({
    version: config.value.version,
    groups: config.value.groups.map((group) => ({
      id: group.id,
      sortOrder: group.sortOrder,
      items: group.items.map((item) => ({
        permissionCode: item.permissionCode,
        sortOrder: item.sortOrder,
      })),
    })),
  })
  saving.value = false
  if (response.code !== 0) {
    toast.error(response.message || "保存失败")
    return
  }
  if (config.value) {
    const next = cloneConfig(config.value)
    next.version = response.data.version
    config.value = next
    savedConfig.value = cloneConfig(next)
  }
  window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
  toast.success("菜单顺序已保存")
}

function openCreateGroup() {
  editingGroup.value = null
  groupName.value = ""
  groupOpen.value = true
}

function openEditGroup(group: MenuGroup) {
  editingGroup.value = group
  groupName.value = group.name
  groupOpen.value = true
}

async function submitGroup() {
  submitting.value = true
  const response = editingGroup.value
    ? await updateMenuGroup(editingGroup.value.id, groupName.value)
    : await createMenuGroup(groupName.value)
  submitting.value = false
  if (response.code !== 0) {
    toast.error(response.message || "操作失败")
    return
  }
  groupOpen.value = false
  await load()
  window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
  toast.success(editingGroup.value ? "分组已更新" : "分组已创建")
}

function openCreateItem(groupId: string) {
  editingItem.value = null
  itemForm.value = {
    permissionCode: "",
    name: "",
    groupId,
    route: "",
    icon: "circle",
  }
  itemOpen.value = true
}

function openEditItem(item: MenuItem) {
  editingItem.value = item
  itemForm.value = {
    permissionCode: item.permissionCode,
    name: item.name,
    groupId: item.groupId,
    route: item.route,
    icon: item.icon,
  }
  itemOpen.value = true
}

async function submitItem() {
  submitting.value = true
  const response = editingItem.value
    ? await updateMenuItem(editingItem.value.permissionCode, {
        name: itemForm.value.name,
        groupId: itemForm.value.groupId,
        route: itemForm.value.route,
        icon: itemForm.value.icon,
      })
    : await createMenuItem(itemForm.value)
  submitting.value = false
  if (response.code !== 0) {
    toast.error(response.message || "操作失败")
    return
  }
  itemOpen.value = false
  await load()
  window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
  toast.success(editingItem.value ? "菜单已更新" : "菜单已创建")
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  const response =
    deleteTarget.value.type === "group"
      ? await deleteMenuGroup(deleteTarget.value.id)
      : await deleteMenuItem(deleteTarget.value.id)
  deleteLoading.value = false
  if (response.code !== 0) {
    toast.error(response.message || "删除失败")
    return
  }
  deleteTarget.value = null
  await load()
  window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
  toast.success("删除成功")
}
</script>

<template>
  <div class="flex flex-col gap-(--page-gap)">
    <PageHeader
      title="菜单管理"
      description="维护系统分组、菜单入口与显示顺序。"
    >
      <template #actions>
        <Badge v-if="dirty" variant="warning">有未保存的排序修改</Badge>
        <Button v-if="canCreate" variant="outline" @click="openCreateGroup">
          <Plus data-icon="inline-start" />
          新增分组
        </Button>
        <LoadingButton
          v-if="canReorder"
          :loading="saving"
          :disabled="!dirty"
          @click="handleSave"
        >
          <Save data-icon="inline-start" />
          保存排序
        </LoadingButton>
      </template>
    </PageHeader>

    <PageFormSkeleton v-if="loading || !config" />

    <EmptyState
      v-else-if="config.groups.length === 0"
      title="还没有菜单分组"
      description="先创建一个分组，再把菜单入口放进去。"
    >
      <template #action>
        <Button v-if="canCreate" @click="openCreateGroup">
          <Plus data-icon="inline-start" />
          新增分组
        </Button>
      </template>
    </EmptyState>

    <DragDropProvider v-else @drag-end="handleDragEnd">
      <div class="flex flex-col gap-4">
        <MenuSortableGroup
          v-for="(group, groupIndex) in config.groups"
          :key="`${group.id}:${dragEpoch}`"
          :group="group"
          :index="groupIndex"
          :can-reorder="canReorder"
          :can-create="canCreate"
          :can-edit="canEdit"
          :can-delete="canDelete"
          :can-move-up="groupIndex > 0"
          :can-move-down="groupIndex < config.groups.length - 1"
          @create-item="openCreateItem"
          @edit-group="openEditGroup"
          @delete-group="
            deleteTarget = {
              type: 'group',
              id: $event.id,
              name: $event.name,
            }
          "
          @edit-item="openEditItem"
          @delete-item="
            deleteTarget = {
              type: 'item',
              id: $event.permissionCode,
              name: $event.name,
            }
          "
          @move-up="moveGroup(group.id, -1)"
          @move-down="moveGroup(group.id, 1)"
          @move-item="moveItem"
        />
      </div>
    </DragDropProvider>

    <FormDialog
      :open="groupOpen"
      :title="editingGroup ? '编辑分组' : '新增分组'"
      description="分组名称仅用于侧边栏展示。"
      :submitting="submitting"
      @update:open="groupOpen = $event"
      @submit="submitGroup"
    >
      <FieldGroup>
        <Field>
          <FieldLabel for="group-name">分组名称</FieldLabel>
          <Input
            id="group-name"
            v-model="groupName"
            name="group-name"
            autocomplete="off"
            required
          />
        </Field>
      </FieldGroup>
    </FormDialog>

    <FormDialog
      :open="itemOpen"
      :title="editingItem ? '编辑菜单' : '新增菜单'"
      description="菜单路由需要由前端页面提供。"
      :submitting="submitting"
      @update:open="itemOpen = $event"
      @submit="submitItem"
    >
      <FieldGroup>
        <Field>
          <FieldLabel for="item-code">权限编码</FieldLabel>
          <Input
            id="item-code"
            v-model="itemForm.permissionCode"
            name="item-code"
            autocomplete="off"
            :spellcheck="false"
            :disabled="!!editingItem"
            required
            pattern="^[a-z0-9_.-]+$"
            title="只能包含小写字母、数字、点、下划线和连字符"
          />
        </Field>
        <Field>
          <FieldLabel for="item-name">菜单名称</FieldLabel>
          <Input
            id="item-name"
            v-model="itemForm.name"
            name="item-name"
            autocomplete="off"
            required
          />
        </Field>
        <Field>
          <FieldLabel>所属分组</FieldLabel>
          <Select v-model="itemForm.groupId">
            <SelectTrigger class="w-full" aria-label="所属分组">
              <SelectValue placeholder="请选择分组" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="group in config?.groups ?? []"
                  :key="group.id"
                  :value="group.id"
                >
                  {{ group.name }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel for="item-route">路由</FieldLabel>
          <Input
            id="item-route"
            v-model="itemForm.route"
            name="item-route"
            autocomplete="off"
            :spellcheck="false"
            placeholder="/settings/example"
            required
          />
        </Field>
        <Field>
          <FieldLabel>图标</FieldLabel>
          <IconPicker v-model="itemForm.icon" />
        </Field>
      </FieldGroup>
    </FormDialog>

    <ConfirmDeleteDialog
      :open="!!deleteTarget"
      :target-name="deleteTarget?.name || ''"
      :description="
        deleteTarget?.type === 'group'
          ? '仅空分组可以删除。'
          : '对应菜单权限和角色授权也会被删除。'
      "
      :loading="deleteLoading"
      @update:open="
        (open) => {
          if (!open) deleteTarget = null
        }
      "
      @confirm="confirmDelete"
    />
  </div>
</template>
