<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/use-toast'
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog.vue'
import IconPicker from '@/components/shared/IconPicker.vue'
import MenuIcon from '@/components/shared/MenuIcon.vue'
import {
  createMenuGroup,
  createMenuItem,
  deleteMenuGroup,
  deleteMenuItem,
  getMenuConfig,
  saveMenuLayout,
  updateMenuGroup,
  updateMenuItem,
} from '@/api/menu'
import type { MenuConfig, MenuGroup, MenuItem } from '@/types/menu'
import { GripVertical, Pencil, Plus, Save, Trash2 } from 'lucide-vue-next'

type DragState =
  | { type: 'group'; groupId: string }
  | { type: 'item'; groupId: string; permissionCode: string }
  | null

const auth = useAuthStore()
const toast = useToast()
const config = ref<MenuConfig | null>(null)
const loading = ref(true)
const saving = ref(false)
const submitting = ref(false)
const dragState = ref<DragState>(null)
const groupOpen = ref(false)
const editingGroup = ref<MenuGroup | null>(null)
const groupName = ref('')
const itemOpen = ref(false)
const editingItem = ref<MenuItem | null>(null)
const itemForm = ref({
  permissionCode: '',
  name: '',
  groupId: '',
  route: '',
  icon: 'circle',
})
const deleteOpen = ref(false)
const deleteTarget = ref<
  { type: 'group'; id: string; name: string } | { type: 'item'; id: string; name: string } | null
>(null)
const deleteLoading = ref(false)

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
  if (response.code === 0) config.value = cloneConfig(response.data)
  else toast.error(response.message || '加载菜单失败')
  loading.value = false
}

onMounted(load)

const groupCount = computed(() => config.value?.groups.length || 0)

function dropGroup(targetId: string) {
  if (!config.value || dragState.value?.type !== 'group' || dragState.value.groupId === targetId) return
  const groups = config.value.groups
  const sourceIndex = groups.findIndex((group) => group.id === dragState.value?.groupId)
  const targetIndex = groups.findIndex((group) => group.id === targetId)
  if (sourceIndex < 0 || targetIndex < 0) return
  const [group] = groups.splice(sourceIndex, 1)
  groups.splice(targetIndex, 0, group)
  config.value = normalize(config.value)
  dragState.value = null
}

function dropItem(targetGroupId: string, targetCode?: string) {
  if (!config.value || dragState.value?.type !== 'item') return
  const activeDrag = dragState.value
  const sourceGroup = config.value.groups.find((group) => group.id === activeDrag.groupId)
  const targetGroup = config.value.groups.find((group) => group.id === targetGroupId)
  if (!sourceGroup || !targetGroup) return
  const sourceIndex = sourceGroup.items.findIndex(
    (item) => item.permissionCode === activeDrag.permissionCode,
  )
  if (sourceIndex < 0) return
  const [item] = sourceGroup.items.splice(sourceIndex, 1)
  const targetIndex = targetCode
    ? targetGroup.items.findIndex((candidate) => candidate.permissionCode === targetCode)
    : targetGroup.items.length
  targetGroup.items.splice(targetIndex < 0 ? targetGroup.items.length : targetIndex, 0, item)
  config.value = normalize(config.value)
  dragState.value = null
}

function handleGroupDrop(groupId: string) {
  if (dragState.value?.type === 'item') dropItem(groupId)
  else dropGroup(groupId)
}

async function handleSave() {
  if (!config.value) return
  saving.value = true
  try {
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
    if (response.code === 0) {
      config.value.version = response.data.version
      window.dispatchEvent(new Event('navigation-refresh'))
      toast.success('菜单顺序已保存')
    } else {
      toast.error(response.message || '保存失败')
    }
  } catch {
    toast.error('保存失败')
  }
  saving.value = false
}

function openCreateGroup() {
  editingGroup.value = null
  groupName.value = ''
  groupOpen.value = true
}

function openEditGroup(group: MenuGroup) {
  editingGroup.value = group
  groupName.value = group.name
  groupOpen.value = true
}

async function submitGroup() {
  submitting.value = true
  try {
    const response = editingGroup.value
      ? await updateMenuGroup(editingGroup.value.id, groupName.value)
      : await createMenuGroup(groupName.value)
    if (response.code === 0) {
      groupOpen.value = false
      await load()
      window.dispatchEvent(new Event('navigation-refresh'))
      toast.success(editingGroup.value ? '分组已更新' : '分组已创建')
    } else {
      toast.error(response.message || '操作失败')
    }
  } catch {
    toast.error('操作失败')
  }
  submitting.value = false
}

function openCreateItem(groupId: string) {
  editingItem.value = null
  itemForm.value = { permissionCode: '', name: '', groupId, route: '', icon: 'circle' }
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
  try {
    const response = editingItem.value
      ? await updateMenuItem(editingItem.value.permissionCode, {
          name: itemForm.value.name,
          groupId: itemForm.value.groupId,
          route: itemForm.value.route,
          icon: itemForm.value.icon,
        })
      : await createMenuItem(itemForm.value)
    if (response.code === 0) {
      itemOpen.value = false
      await load()
      window.dispatchEvent(new Event('navigation-refresh'))
      toast.success(editingItem.value ? '菜单已更新' : '菜单已创建')
    } else {
      toast.error(response.message || '操作失败')
    }
  } catch {
    toast.error('操作失败')
  }
  submitting.value = false
}

function askDeleteGroup(group: MenuGroup) {
  deleteTarget.value = { type: 'group', id: group.id, name: group.name }
  deleteOpen.value = true
}

function askDeleteItem(item: MenuItem) {
  deleteTarget.value = { type: 'item', id: item.permissionCode, name: item.name }
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  try {
    const response =
      deleteTarget.value.type === 'group'
        ? await deleteMenuGroup(deleteTarget.value.id)
        : await deleteMenuItem(deleteTarget.value.id)
    if (response.code === 0) {
      deleteOpen.value = false
      deleteTarget.value = null
      await load()
      window.dispatchEvent(new Event('navigation-refresh'))
      toast.success('删除成功')
    } else {
      toast.error(response.message || '删除失败')
    }
  } catch {
    toast.error('删除失败')
  }
  deleteLoading.value = false
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">菜单管理</h1>
        <p class="text-base-content/50">维护系统分组、菜单入口与显示顺序。</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="auth.hasPermission('menus.create')"
          class="btn btn-outline btn-sm"
          @click="openCreateGroup"
        >
          <Plus class="size-4" />
          新增分组
        </button>
        <button
          v-if="auth.hasPermission('menus.reorder')"
          class="btn btn-primary btn-sm"
          :disabled="saving"
          @click="handleSave"
        >
          <span v-if="saving" class="loading loading-spinner loading-sm"></span>
          <Save v-else class="size-4" />
          保存排序
        </button>
      </div>
    </div>

    <div v-if="loading" class="skeleton h-96 w-full"></div>
    <div v-else class="flex flex-col gap-4">
      <div v-if="groupCount === 0" class="rounded-xl border border-dashed p-10 text-center text-base-content/50">
        暂无菜单分组
      </div>
      <div
        v-for="group in config?.groups"
        :key="group.id"
        class="card rounded-xl border border-base-content/10"
        @dragover.prevent
        @drop="handleGroupDrop(group.id)"
      >
        <div class="card-body p-0">
          <div class="flex items-center justify-between gap-3 border-b border-base-content/10 px-4 py-3">
            <div class="flex min-w-0 items-center gap-2">
              <button
                v-if="auth.hasPermission('menus.reorder')"
                type="button"
                draggable="true"
                class="cursor-grab text-base-content/40"
                @dragstart="dragState = { type: 'group', groupId: group.id }"
                @dragend="dragState = null"
              >
                <GripVertical class="size-4" />
              </button>
              <h3 class="truncate font-semibold">{{ group.name }}</h3>
              <span v-if="group.isSystem" class="badge badge-ghost badge-sm">内置</span>
            </div>
            <div class="flex items-center gap-1">
              <button
                v-if="auth.hasPermission('menus.create')"
                class="btn btn-ghost btn-sm"
                @click="openCreateItem(group.id)"
              >
                <Plus class="size-4" />
                新增菜单
              </button>
              <button
                v-if="auth.hasPermission('menus.edit')"
                class="btn btn-ghost btn-sm btn-square"
                @click="openEditGroup(group)"
              >
                <Pencil class="size-4" />
              </button>
              <button
                v-if="auth.hasPermission('menus.delete') && !group.isSystem"
                class="btn btn-ghost btn-sm btn-square"
                @click="askDeleteGroup(group)"
              >
                <Trash2 class="size-4" />
              </button>
            </div>
          </div>
          <div class="flex flex-col gap-1 p-2">
            <div
              v-for="item in group.items"
              :key="item.permissionCode"
              :draggable="auth.hasPermission('menus.reorder')"
              class="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-base-200"
              @dragstart.stop="
                dragState = {
                  type: 'item',
                  groupId: group.id,
                  permissionCode: item.permissionCode,
                }
              "
              @dragend="dragState = null"
              @dragover.prevent
              @drop.stop="dropItem(group.id, item.permissionCode)"
            >
              <div class="flex min-w-0 items-center gap-3">
                <GripVertical class="size-4 shrink-0 cursor-grab text-base-content/30" />
                <MenuIcon :name="item.icon" class="size-4 shrink-0" />
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium">{{ item.name }}</p>
                  <p class="truncate text-xs text-base-content/50">{{ item.route }}</p>
                </div>
                <span v-if="item.isSystem" class="badge badge-ghost badge-sm">内置</span>
              </div>
              <div class="flex shrink-0 items-center gap-1">
                <button
                  v-if="auth.hasPermission('menus.edit')"
                  class="btn btn-ghost btn-xs btn-square"
                  @click="openEditItem(item)"
                >
                  <Pencil class="size-3" />
                </button>
                <button
                  v-if="auth.hasPermission('menus.delete') && !item.isSystem"
                  class="btn btn-ghost btn-xs btn-square"
                  @click="askDeleteItem(item)"
                >
                  <Trash2 class="size-3" />
                </button>
              </div>
            </div>
            <div v-if="group.items.length === 0" class="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-base-content/50">
              暂无菜单
            </div>
          </div>
        </div>
      </div>
    </div>

    <dialog :class="{ modal: true, 'modal-open': groupOpen }">
      <div class="modal-box">
        <h3 class="text-lg font-bold">{{ editingGroup ? '编辑分组' : '新增分组' }}</h3>
        <form @submit.prevent="submitGroup">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">分组名称</legend>
            <input v-model="groupName" class="input input-bordered w-full" required />
          </fieldset>
          <div class="modal-action">
            <button type="button" class="btn" @click="groupOpen = false">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              <span v-if="submitting" class="loading loading-spinner loading-sm"></span>
              保存
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="groupOpen = false">close</button></form>
    </dialog>

    <dialog :class="{ modal: true, 'modal-open': itemOpen }">
      <div class="modal-box">
        <h3 class="text-lg font-bold">{{ editingItem ? '编辑菜单' : '新增菜单' }}</h3>
        <form @submit.prevent="submitItem">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">权限编码</legend>
            <input
              v-model="itemForm.permissionCode"
              class="input input-bordered w-full"
              :disabled="!!editingItem"
              required
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">菜单名称</legend>
            <input v-model="itemForm.name" class="input input-bordered w-full" required />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">所属分组</legend>
            <select v-model="itemForm.groupId" class="select select-bordered w-full">
              <option v-for="group in config?.groups" :key="group.id" :value="group.id">
                {{ group.name }}
              </option>
            </select>
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">路由</legend>
            <input
              v-model="itemForm.route"
              class="input input-bordered w-full"
              placeholder="/settings/example"
              required
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">图标</legend>
            <IconPicker v-model="itemForm.icon" />
          </fieldset>
          <div class="modal-action">
            <button type="button" class="btn" @click="itemOpen = false">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              <span v-if="submitting" class="loading loading-spinner loading-sm"></span>
              保存
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="itemOpen = false">close</button></form>
    </dialog>

    <ConfirmDeleteDialog
      :open="deleteOpen"
      :target-name="deleteTarget?.name || ''"
      :description="deleteTarget?.type === 'group' ? '仅空分组可以删除。' : '对应菜单权限和角色授权也会被删除。'"
      :loading="deleteLoading"
      @update:open="deleteOpen = $event"
      @confirm="confirmDelete"
    />
  </div>
</template>
