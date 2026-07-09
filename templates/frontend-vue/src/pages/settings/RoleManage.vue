<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getRoles, createRole, updateRole, deleteRole } from '@/lib/api'
import type { Role } from '@/types/api'
import { SEED_MENU_PERMISSIONS, SEED_OPERATION_PERMISSIONS } from '@/lib/permissions'
import { useToast } from '@/composables/use-toast'
import Pagination from '@/components/shared/Pagination.vue'
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog.vue'
import { Pencil, Trash2, Plus, Search, Lock } from 'lucide-vue-next'

const auth = useAuthStore()
const toast = useToast()

const PAGE_SIZE = 8

const roles = ref<Role[]>([])
const search = ref('')
const page = ref(1)
const total = ref(0)
const tableLoading = ref(true)
const totalPages = ref(1)

async function loadData() {
  tableLoading.value = true
  const res = await getRoles({ search: search.value, page: page.value, pageSize: PAGE_SIZE })
  if (res.code === 0) {
    roles.value = res.data.list
    total.value = res.data.total
    totalPages.value = Math.max(1, Math.ceil(res.data.total / PAGE_SIZE))
  } else {
    toast.error(res.message || '加载数据失败')
  }
  tableLoading.value = false
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  page.value = 1
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadData(), 300)
})

watch(page, () => loadData())

onMounted(() => loadData())

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer)
})

// Edit dialog
const editOpen = ref(false)
const editingRole = ref<Role | null>(null)
const editForm = ref({ name: '', description: '' })
const editPermissions = ref<string[]>([])
const editSubmitting = ref(false)

function handleAdd() {
  editingRole.value = null
  editForm.value = { name: '', description: '' }
  editPermissions.value = []
  editOpen.value = true
}

function handleEdit(role: Role) {
  editingRole.value = role
  editForm.value = { name: role.name, description: role.description }
  editPermissions.value = [...role.permissions]
  editOpen.value = true
}

async function handleEditSubmit() {
  editSubmitting.value = true
  try {
    const res = editingRole.value
      ? await updateRole(editingRole.value.id, {
          name: editForm.value.name,
          description: editForm.value.description,
          permissions: editPermissions.value,
        })
      : await createRole({
          name: editForm.value.name,
          description: editForm.value.description,
          permissions: editPermissions.value,
        })
    if (res.code === 0) {
      toast.success(editingRole.value ? '更新成功' : '创建成功')
      editOpen.value = false
      loadData()
    } else {
      toast.error(res.message || '操作失败')
    }
  } catch {
    toast.error('网络请求失败')
  }
  editSubmitting.value = false
}

function togglePermission(code: string) {
  const idx = editPermissions.value.indexOf(code)
  if (idx >= 0) {
    editPermissions.value.splice(idx, 1)
  } else {
    editPermissions.value.push(code)
  }
}

function toggleMenuPermission(code: string) {
  const has = editPermissions.value.includes(code)
  if (has) {
    editPermissions.value = editPermissions.value.filter(
      (c) => c !== code && !SEED_OPERATION_PERMISSIONS.some((op) => op.code === c && op.parent === code),
    )
  } else {
    const childOps = SEED_OPERATION_PERMISSIONS.filter((op) => op.parent === code).map((op) => op.code)
    editPermissions.value = [...editPermissions.value, code, ...childOps.filter((c) => !editPermissions.value.includes(c))]
  }
}

function isMenuChecked(code: string): boolean {
  return editPermissions.value.includes(code)
}

function isMenuIndeterminate(code: string): boolean {
  const children = SEED_OPERATION_PERMISSIONS.filter((op) => op.parent === code)
  if (children.length === 0) return false
  const checkedCount = children.filter((c) => editPermissions.value.includes(c.code)).length
  return checkedCount > 0 && checkedCount < children.length
}

// Delete dialog
const deleteOpen = ref(false)
const deleteTarget = ref<Role | null>(null)
const deleteSubmitting = ref(false)

function handleDelete(role: Role) {
  deleteTarget.value = role
  deleteOpen.value = true
}

async function handleDeleteConfirm() {
  deleteSubmitting.value = true
  try {
    if (deleteTarget.value) {
      const res = await deleteRole(deleteTarget.value.id)
      if (res.code === 0) {
        toast.success('删除成功')
        deleteOpen.value = false
        loadData()
      } else {
        toast.error(res.message || '删除失败')
      }
    }
  } catch {
    toast.error('网络请求失败')
  }
  deleteSubmitting.value = false
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">角色管理</h1>
      <p class="text-base-content/50">管理系统角色及其权限分配。</p>
    </div>

    <div v-if="tableLoading" class="skeleton h-96 w-full"></div>

    <div v-else class="card border border-base-content/10 rounded-xl">
      <div class="card-body">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 class="card-title">角色列表</h3>
            <p class="text-sm text-base-content/50">共 {{ roles.length }} 个角色</p>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div class="relative w-full sm:w-64">
              <Search class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-base-content/50" />
              <input v-model="search" placeholder="搜索角色名称..." class="input input-bordered input-sm w-full pl-8" />
            </div>
            <button v-if="auth.hasPermission('roles.create')" class="btn btn-primary btn-sm" @click="handleAdd">
              <Plus class="size-4" />
              新增角色
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>角色名称</th>
                <th>描述</th>
                <th>权限数</th>
                <th>类型</th>
                <th class="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="role in roles" :key="role.id">
                <td class="font-medium">{{ role.name }}</td>
                <td class="text-base-content/50">{{ role.description }}</td>
                <td>
                  <span class="badge badge-secondary">{{ role.permissions.length }}</span>
                </td>
                <td>
                  <span v-if="role.isPreset" class="badge badge-outline">
                    <Lock class="size-3" />
                    预设
                  </span>
                  <span v-else class="badge badge-secondary">自定义</span>
                </td>
                <td class="text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button v-if="auth.hasPermission('roles.edit')" class="btn btn-ghost btn-xs" @click="handleEdit(role)">
                      <Pencil class="size-3" />
                    </button>
                    <button v-if="!role.isPreset && auth.hasPermission('roles.delete')" class="btn btn-ghost btn-xs" @click="handleDelete(role)">
                      <Trash2 class="size-3" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="roles.length === 0">
                <td colspan="5" class="text-center text-base-content/50">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Pagination :page="page" :total-pages="totalPages" @update:page="page = $event" />
      </div>
    </div>

    <!-- Edit dialog -->
    <dialog :class="{ modal: true, 'modal-open': editOpen }" @close="editOpen = false">
      <div class="modal-box max-w-lg">
        <h3 class="text-lg font-bold">{{ editingRole ? '编辑角色' : '新增角色' }}</h3>
        <p class="text-sm text-base-content/50">{{ editingRole ? '修改角色信息和权限分配。' : '填写角色信息并分配权限。' }}</p>
        <form @submit.prevent="handleEditSubmit">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">角色名称</legend>
            <input v-model="editForm.name" placeholder="请输入角色名称" class="input input-bordered w-full" required />
          </fieldset>
          <fieldset class="fieldset mt-2">
            <legend class="fieldset-legend">描述</legend>
            <input v-model="editForm.description" placeholder="请输入角色描述" class="input input-bordered w-full" />
          </fieldset>

          <div class="divider"></div>

          <div class="flex flex-col gap-3">
            <span class="text-sm font-medium">权限分配</span>
            <div class="flex max-h-[50vh] flex-col gap-2 overflow-auto">
              <span class="text-xs font-medium text-base-content/50">菜单权限</span>
              <div v-for="perm in SEED_MENU_PERMISSIONS" :key="perm.code" class="flex flex-col gap-1">
                <label class="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    :checked="isMenuChecked(perm.code) || isMenuIndeterminate(perm.code)"
                    @change="toggleMenuPermission(perm.code)"
                  />
                  {{ perm.name }}
                </label>
                <div v-if="isMenuChecked(perm.code)" class="ml-6 flex flex-wrap gap-x-4 gap-y-1">
                  <label
                    v-for="child in SEED_OPERATION_PERMISSIONS.filter((op) => op.parent === perm.code)"
                    :key="child.code"
                    class="flex items-center gap-2 text-sm text-base-content/50"
                  >
                    <input
                      type="checkbox"
                      class="checkbox checkbox-sm"
                      :checked="editPermissions.includes(child.code)"
                      @change="togglePermission(child.code)"
                    />
                    {{ child.name }}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" @click="editOpen = false">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="editSubmitting">
              <span v-if="editSubmitting" class="loading loading-spinner loading-sm"></span>
              保存
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <ConfirmDeleteDialog
      :open="deleteOpen"
      :target-name="deleteTarget?.name || ''"
      description="已分配该角色的用户将失去对应权限。"
      :loading="deleteSubmitting"
      @update:open="deleteOpen = $event"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>
