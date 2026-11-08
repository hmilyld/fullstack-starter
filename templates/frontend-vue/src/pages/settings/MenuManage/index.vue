<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { RouterLink } from "vue-router"
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/vue"
import { isSortable } from "@dnd-kit/vue/sortable"
import { KeyRound, Plus, Search } from "@lucide/vue"
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog.vue"
import ConfirmHideDialog from "@/components/shared/ConfirmHideDialog.vue"
import EmptyState from "@/components/shared/EmptyState.vue"
import ErrorState from "@/components/shared/ErrorState.vue"
import FormDialog from "@/components/shared/FormDialog.vue"
import IconPicker from "@/components/shared/IconPicker.vue"
import InlineError from "@/components/shared/InlineError.vue"
import PageFormSkeleton from "@/components/shared/PageFormSkeleton.vue"
import PageHeader from "@/components/shared/PageHeader.vue"
import MenuSortableGroup from "@/pages/settings/MenuManage/MenuSortableGroup.vue"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
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
import {
  createPermission,
  deletePermission,
  updatePermission,
} from "@/api/permission"
import { useAuthStore } from "@/stores/auth"
import { useToast } from "@/composables/use-toast"
import { OPERATION_PRESETS, buildOperationCode } from "@/lib/access-tree"
import type {
  MenuConfig,
  MenuGroup,
  MenuItem,
  MenuOperation,
} from "@/types/menu"
import {
  applyMenuDrag,
  cloneMenuConfig,
  moveMenuGroup,
  moveMenuItem,
  type MenuDragData,
} from "@/pages/settings/MenuManage/menu-drag"

const NAVIGATION_REFRESH_EVENT = "navigation-refresh"

type DeleteTarget =
  | { type: "group"; id: string; name: string }
  | { type: "item"; id: string; name: string; operationCount: number }
  | { type: "operation"; id: string; name: string }
  | null

const auth = useAuthStore()
const toast = useToast()

const config = ref<MenuConfig | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)
const submitting = ref(false)
const expanded = ref<Set<string>>(new Set())
const search = ref("")
const dragEpoch = ref(0)

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
  hidden: false,
})

const operationOpen = ref(false)
const operationMenu = ref<MenuItem | null>(null)
const editingOperation = ref<MenuOperation | null>(null)
const operationForm = ref({
  name: "",
  verb: "view",
  code: "",
  custom: false,
})

const deleteTarget = ref<DeleteTarget>(null)
const deleteLoading = ref(false)
const hideConfirmTarget = ref<MenuItem | null>(null)
const hideConfirmLoading = ref(false)
const pendingItemSubmit = ref(false)

const canReorder = computed(() => auth.hasPermission("menus.reorder"))
const canCreate = computed(() => auth.hasPermission("menus.create"))
const canEdit = computed(() => auth.hasPermission("menus.edit"))
const canDelete = computed(() => auth.hasPermission("menus.delete"))
const canViewOverview = computed(() => auth.hasPermission("permissions"))
const canCreateOperation = computed(() =>
  auth.hasPermission("permissions.create")
)
const canEditOperation = computed(() => auth.hasPermission("permissions.edit"))
const canDeleteOperation = computed(() =>
  auth.hasPermission("permissions.delete")
)
const reorderEnabled = computed(
  () => canReorder.value && !search.value.trim() && !saving.value
)

const visibleGroups = computed<MenuGroup[]>(() => {
  if (!config.value) return []
  const query = search.value.trim().toLowerCase()
  if (!query) return config.value.groups
  return config.value.groups
    .map((group) => {
      const groupMatch = group.name.toLowerCase().includes(query)
      const items = group.items.filter((item) => {
        const itemMatch =
          item.name.toLowerCase().includes(query) ||
          item.permissionCode.toLowerCase().includes(query) ||
          item.route.toLowerCase().includes(query)
        const operationMatch = item.operations.some(
          (operation) =>
            operation.name.toLowerCase().includes(query) ||
            operation.code.toLowerCase().includes(query)
        )
        return itemMatch || operationMatch
      })
      if (!groupMatch && items.length === 0) return null
      return { ...group, items: groupMatch ? group.items : items }
    })
    .filter((group): group is MenuGroup => group !== null)
})

watch([search, config], () => {
  const query = search.value.trim().toLowerCase()
  if (!query || !config.value) return
  const next = new Set<string>()
  for (const group of config.value.groups) {
    for (const item of group.items) {
      if (
        item.operations.some(
          (operation) =>
            operation.name.toLowerCase().includes(query) ||
            operation.code.toLowerCase().includes(query)
        )
      ) {
        next.add(item.permissionCode)
      }
    }
  }
  expanded.value = next
})

async function load(): Promise<boolean> {
  loading.value = true
  error.value = null
  const response = await getMenuConfig()
  if (response.code === 0) {
    config.value = cloneMenuConfig(response.data)
    dragEpoch.value += 1
    loading.value = false
    return true
  }
  error.value = response.message || "加载菜单失败"
  loading.value = false
  return false
}

onMounted(() => {
  void load()
})

function toggleExpanded(permissionCode: string) {
  const next = new Set(expanded.value)
  if (next.has(permissionCode)) next.delete(permissionCode)
  else next.add(permissionCode)
  expanded.value = next
}

async function persistLayout(next: MenuConfig) {
  if (!canReorder.value || saving.value) return
  saving.value = true
  try {
    const response = await saveMenuLayout({
      version: next.version,
      groups: next.groups.map((group) => ({
        id: group.id,
        sortOrder: group.sortOrder,
        items: group.items.map((item) => ({
          permissionCode: item.permissionCode,
          sortOrder: item.sortOrder,
        })),
      })),
    })
    if (response.code !== 0) {
      toast.error(response.message || "保存失败")
      await load()
      return
    }
    const updated = cloneMenuConfig(next)
    updated.version = response.data.version
    config.value = updated
    error.value = null
    window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
  } finally {
    saving.value = false
  }
}

function moveGroup(groupId: string, direction: -1 | 1) {
  if (!config.value || !reorderEnabled.value) return
  const next = moveMenuGroup(config.value, groupId, direction)
  config.value = next
  void persistLayout(next)
}

function moveItem(groupId: string, permissionCode: string, direction: -1 | 1) {
  if (!config.value || !reorderEnabled.value) return
  const next = moveMenuItem(config.value, groupId, permissionCode, direction)
  config.value = next
  void persistLayout(next)
}

function handleDragEnd(event: DragEndEvent) {
  if (!reorderEnabled.value) return
  if (event.canceled) return
  const source = event.operation.source
  if (!source || !isSortable(source)) return

  const sourceData = source.data as MenuDragData | undefined
  if (!sourceData) return

  const targetData = event.operation.target?.data as MenuDragData | undefined
  const before = config.value ? JSON.stringify(config.value) : ""

  if (config.value) {
    config.value = applyMenuDrag(
      config.value,
      {
        type: sourceData.type === "group" ? "group" : "item",
        initialIndex: source.initialIndex,
        index: source.index,
        groupId: sourceData.groupId,
        permissionCode:
          sourceData.type === "item" ? sourceData.permissionCode : undefined,
        initialGroup: source.initialGroup as string | undefined,
        group: source.group as string | undefined,
      },
      targetData
        ? {
            type: targetData.type,
            groupId: targetData.groupId,
            index: targetData.index,
          }
        : undefined
    )
  }

  const after = config.value ? JSON.stringify(config.value) : ""
  if (before === after) {
    dragEpoch.value += 1
    return
  }
  if (config.value) void persistLayout(config.value)
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
  if (saving.value) return
  saving.value = true
  submitting.value = true
  try {
    const response = editingGroup.value
      ? await updateMenuGroup(editingGroup.value.id, groupName.value)
      : await createMenuGroup(groupName.value)
    if (response.code !== 0) {
      toast.error(response.message || "操作失败")
      return
    }
    groupOpen.value = false
    await load()
    window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
    toast.success(editingGroup.value ? "分组已更新" : "分组已创建")
  } finally {
    submitting.value = false
    saving.value = false
  }
}

function openCreateItem(groupId: string) {
  editingItem.value = null
  itemForm.value = {
    permissionCode: "",
    name: "",
    groupId,
    route: "",
    icon: "circle",
    hidden: false,
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
    hidden: item.hidden,
  }
  itemOpen.value = true
}

async function submitItem() {
  if (saving.value) return
  if (
    editingItem.value &&
    (editingItem.value.permissionCode === "menus" ||
      editingItem.value.permissionCode === "settings") &&
    itemForm.value.hidden &&
    !editingItem.value.hidden
  ) {
    hideConfirmTarget.value = editingItem.value
    pendingItemSubmit.value = true
    return
  }
  await submitItemNow()
}

async function submitItemNow() {
  if (saving.value) return
  saving.value = true
  submitting.value = true
  try {
    const response = editingItem.value
      ? await updateMenuItem(editingItem.value.permissionCode, {
          name: itemForm.value.name,
          groupId: itemForm.value.groupId,
          route: itemForm.value.route,
          icon: itemForm.value.icon,
          hidden: itemForm.value.hidden,
        })
      : await createMenuItem(itemForm.value)
    if (response.code !== 0) {
      toast.error(response.message || "操作失败")
      return
    }
    itemOpen.value = false
    await load()
    window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
    toast.success(editingItem.value ? "菜单已更新" : "菜单已创建")
  } finally {
    submitting.value = false
    saving.value = false
  }
}

async function applyHidden(item: MenuItem, hidden: boolean) {
  if (saving.value) return false
  saving.value = true
  try {
    const response = await updateMenuItem(item.permissionCode, { hidden })
    if (response.code !== 0) {
      toast.error(response.message || "操作失败")
      return false
    }
    if (!(await load())) {
      toast.error("菜单状态已保存，但列表刷新失败，请重试")
      return false
    }
    window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
    toast.success(hidden ? "菜单已隐藏" : "菜单已显示")
    return true
  } finally {
    saving.value = false
  }
}

async function toggleHidden(item: MenuItem) {
  if (item.hidden) {
    await applyHidden(item, false)
    return
  }
  if (item.permissionCode === "menus" || item.permissionCode === "settings") {
    pendingItemSubmit.value = false
    hideConfirmTarget.value = item
    return
  }
  await applyHidden(item, true)
}

async function confirmHide() {
  if (!hideConfirmTarget.value || saving.value) return
  hideConfirmLoading.value = true
  const ok = await applyHidden(hideConfirmTarget.value, true)
  hideConfirmLoading.value = false
  if (ok) hideConfirmTarget.value = null
}

async function handleHideConfirm() {
  if (pendingItemSubmit.value) {
    pendingItemSubmit.value = false
    hideConfirmTarget.value = null
    await submitItemNow()
    return
  }
  await confirmHide()
}

function handleItemVisibleChange(visible: boolean) {
  itemForm.value.hidden = !visible
}

function openCreateOperation(item: MenuItem) {
  operationMenu.value = item
  editingOperation.value = null
  operationForm.value = {
    name: "",
    verb: "view",
    code: buildOperationCode(item.permissionCode, "view"),
    custom: false,
  }
  operationOpen.value = true
}

function openEditOperation(item: MenuItem, operation: MenuOperation) {
  operationMenu.value = item
  editingOperation.value = operation
  operationForm.value = {
    name: operation.name,
    verb: "",
    code: operation.code,
    custom: true,
  }
  operationOpen.value = true
}

function handleDeleteOperation(_item: MenuItem, operation: MenuOperation) {
  deleteTarget.value = {
    type: "operation",
    id: operation.code,
    name: operation.name,
  }
}

function handleOperationVerbChange(verb: string) {
  operationForm.value.verb = verb
  if (!operationForm.value.custom && operationMenu.value) {
    operationForm.value.code = buildOperationCode(
      operationMenu.value.permissionCode,
      verb
    )
  }
}

function handleOperationCustomChange(custom: boolean) {
  operationForm.value.custom = custom
  if (!custom && operationMenu.value) {
    operationForm.value.code = buildOperationCode(
      operationMenu.value.permissionCode,
      operationForm.value.verb || "view"
    )
  }
}

async function submitOperation() {
  if (!operationMenu.value || saving.value) return
  if (!operationForm.value.name.trim()) {
    toast.error("请输入权限名称")
    return
  }
  const code = operationForm.value.code.trim()
  if (!editingOperation.value && !code) {
    toast.error("请输入权限编码")
    return
  }

  saving.value = true
  submitting.value = true
  try {
    const response = editingOperation.value
      ? await updatePermission(editingOperation.value.code, {
          name: operationForm.value.name,
          parent: operationMenu.value.permissionCode,
        })
      : await createPermission({
          code,
          name: operationForm.value.name,
          type: "operation",
          parent: operationMenu.value.permissionCode,
        })
    if (response.code !== 0) {
      toast.error(response.message || "操作失败")
      return
    }
    toast.success(editingOperation.value ? "操作权限已更新" : "操作权限已创建")
    operationOpen.value = false
    await load()
  } finally {
    submitting.value = false
    saving.value = false
  }
}

async function confirmDelete() {
  if (!deleteTarget.value || saving.value) return
  const target = deleteTarget.value
  saving.value = true
  deleteLoading.value = true
  try {
    const response =
      target.type === "group"
        ? await deleteMenuGroup(target.id)
        : target.type === "item"
          ? await deleteMenuItem(target.id)
          : await deletePermission(target.id)
    if (response.code !== 0) {
      toast.error(response.message || "删除失败")
      return
    }
    deleteTarget.value = null
    await load()
    if (target.type !== "operation") {
      window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
    }
    toast.success("删除成功")
  } finally {
    deleteLoading.value = false
    saving.value = false
  }
}

const deleteDescription = computed(() => {
  if (deleteTarget.value?.type === "item") {
    return deleteTarget.value.operationCount > 0
      ? `删除后将同时移除 ${deleteTarget.value.operationCount} 个操作权限，并从相关角色中移除授权。`
      : "对应菜单权限和角色授权也会被删除。"
  }
  if (deleteTarget.value?.type === "operation") {
    return "删除后，已授予该权限的角色会同步失去此权限。"
  }
  if (deleteTarget.value?.type === "group") {
    return "仅空分组可以删除。"
  }
  return undefined
})

const operationTitle = computed(() =>
  editingOperation.value ? "编辑操作权限" : "新增操作权限"
)

const operationDescription = computed(() =>
  operationMenu.value
    ? `所属菜单：${operationMenu.value.name}（${operationMenu.value.permissionCode}）`
    : undefined
)
</script>

<template>
  <div class="flex flex-col gap-(--page-gap)">
    <PageHeader
      title="菜单与权限"
      description="维护侧边栏结构与显示状态，并管理每个菜单下的操作权限。"
    >
      <template #actions>
        <span v-if="saving" class="text-xs text-muted-foreground">
          正在保存…
        </span>
        <Button v-if="canViewOverview" as-child variant="outline">
          <RouterLink to="/settings/permission">
            <KeyRound data-icon="inline-start" />
            权限总览
          </RouterLink>
        </Button>
        <Button
          v-if="canCreate"
          variant="outline"
          :disabled="saving"
          @click="openCreateGroup"
        >
          <Plus data-icon="inline-start" />
          新增分组
        </Button>
      </template>
    </PageHeader>

    <div
      class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
    >
      <InputGroup class="w-full md:w-72">
        <InputGroupInput
          name="q"
          autocomplete="off"
          :spellcheck="false"
          placeholder="搜索菜单或操作权限…"
          aria-label="搜索菜单"
          :model-value="search"
          @update:model-value="search = String($event)"
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      </InputGroup>
      <p v-if="search.trim()" class="text-xs text-muted-foreground">
        搜索时暂时关闭拖拽排序
      </p>
    </div>

    <InlineError v-if="error && config" :message="error" :on-retry="load" />

    <PageFormSkeleton v-if="loading" />

    <ErrorState
      v-else-if="!config"
      :message="error || '加载菜单失败'"
      :on-retry="load"
    />

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

    <EmptyState
      v-else-if="visibleGroups.length === 0"
      title="没有匹配的菜单"
      description="换个关键词，或清空搜索条件后再试。"
    >
      <template #action>
        <Button variant="outline" @click="search = ''">清空搜索</Button>
      </template>
    </EmptyState>

    <DragDropProvider v-else @drag-end="handleDragEnd">
      <div class="flex flex-col gap-4">
        <MenuSortableGroup
          v-for="(group, groupIndex) in visibleGroups"
          :key="`${group.id}:${dragEpoch}`"
          :group="group"
          :index="groupIndex"
          :can-reorder="reorderEnabled"
          :can-create="canCreate"
          :can-edit="canEdit"
          :can-delete="canDelete"
          :can-create-operation="canCreateOperation"
          :can-edit-operation="canEditOperation"
          :can-delete-operation="canDeleteOperation"
          :mutations-disabled="saving"
          :expanded="expanded"
          :can-move-up="groupIndex > 0"
          :can-move-down="groupIndex < visibleGroups.length - 1"
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
              operationCount: $event.operations.length,
            }
          "
          @move-up="moveGroup(group.id, -1)"
          @move-down="moveGroup(group.id, 1)"
          @move-item="moveItem"
          @toggle-expanded="toggleExpanded"
          @toggle-hidden="toggleHidden"
          @add-operation="openCreateOperation"
          @edit-operation="openEditOperation"
          @delete-operation="handleDeleteOperation"
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
        <Field orientation="horizontal">
          <div class="flex flex-1 flex-col gap-1">
            <FieldLabel for="item-visible">在侧边栏显示</FieldLabel>
            <FieldDescription>
              {{
                editingItem?.permissionCode === "menus" ||
                editingItem?.permissionCode === "settings"
                  ? "隐藏后仍可通过 /settings/menu 直接访问并重新显示。"
                  : "关闭后菜单仍保留权限和路由，只是不在侧边栏展示。"
              }}
            </FieldDescription>
          </div>
          <Switch
            id="item-visible"
            :model-value="!itemForm.hidden"
            @update:model-value="handleItemVisibleChange"
          />
        </Field>
      </FieldGroup>
    </FormDialog>

    <FormDialog
      :open="operationOpen"
      :title="operationTitle"
      :description="operationDescription"
      :submitting="submitting"
      @update:open="operationOpen = $event"
      @submit="submitOperation"
    >
      <FieldGroup>
        <Field>
          <FieldLabel for="operation-name">权限名称</FieldLabel>
          <Input
            id="operation-name"
            v-model="operationForm.name"
            name="operation-name"
            autocomplete="off"
            placeholder="如：新增用户"
            required
          />
        </Field>
        <Field v-if="!editingOperation">
          <FieldLabel>常用动作</FieldLabel>
          <Select
            :model-value="operationForm.verb"
            @update:model-value="handleOperationVerbChange(String($event))"
          >
            <SelectTrigger class="w-full" aria-label="常用动作">
              <SelectValue placeholder="选择常用动作" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="preset in OPERATION_PRESETS"
                  :key="preset.verb"
                  :value="preset.verb"
                >
                  {{ preset.label }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field orientation="horizontal">
          <div class="flex flex-1 flex-col gap-1">
            <FieldLabel for="operation-custom">自定义编码</FieldLabel>
            <FieldDescription>
              关闭时按“菜单编码.动作”自动生成。
            </FieldDescription>
          </div>
          <Switch
            id="operation-custom"
            :model-value="operationForm.custom"
            :disabled="!!editingOperation"
            @update:model-value="handleOperationCustomChange"
          />
        </Field>
        <Field>
          <FieldLabel for="operation-code">权限编码</FieldLabel>
          <Input
            id="operation-code"
            v-model="operationForm.code"
            name="operation-code"
            autocomplete="off"
            :spellcheck="false"
            :disabled="!operationForm.custom || !!editingOperation"
            required
            pattern="^[a-z0-9_.-]+$"
            title="只能包含小写字母、数字、点、下划线和连字符"
          />
          <FieldDescription>
            编码用于后端鉴权，请与代码中的权限码保持一致。
          </FieldDescription>
        </Field>
      </FieldGroup>
    </FormDialog>

    <ConfirmDeleteDialog
      :open="!!deleteTarget"
      :target-name="deleteTarget?.name || ''"
      :description="deleteDescription"
      :loading="deleteLoading"
      @update:open="
        (open) => {
          if (!open) deleteTarget = null
        }
      "
      @confirm="confirmDelete"
    />

    <ConfirmHideDialog
      :open="!!hideConfirmTarget"
      :target-name="hideConfirmTarget?.name || ''"
      :loading="hideConfirmLoading"
      @update:open="
        (open) => {
          if (!open) {
            hideConfirmTarget = null
            pendingItemSubmit = false
          }
        }
      "
      @confirm="handleHideConfirm"
    />
  </div>
</template>
