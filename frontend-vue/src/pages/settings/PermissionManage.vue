<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getPermissions, createPermission, updatePermission, deletePermission } from '@/lib/api'
import type { Permission } from '@/types/api'
import { useToast } from '@/composables/use-toast'
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog.vue'
import { Pencil, Trash2, Plus, Search, ChevronRight } from 'lucide-vue-next'

const auth = useAuthStore()
const toast = useToast()

const menuPermissions = ref<Permission[]>([])
const operationPermissions = ref<Permission[]>([])
const expanded = ref<Set<string>>(new Set())
const search = ref('')
const tableLoading = ref(true)
const editSubmitting = ref(false)
const deleteSubmitting = ref(false)

type PermissionTreeNode = Permission & {
  children: Permission[]
}

async function loadData() {
  tableLoading.value = true
  const [menuRes, opRes] = await Promise.all([
    getPermissions({ type: 'menu' }),
    getPermissions({ type: 'operation' }),
  ])
  if (menuRes.code === 0) menuPermissions.value = menuRes.data
  if (opRes.code === 0) operationPermissions.value = opRes.data
  if (menuRes.code !== 0 || opRes.code !== 0) {
    toast.error('加载权限数据失败')
  }
  tableLoading.value = false
}

onMounted(() => loadData())

const tree = computed<PermissionTreeNode[]>(() => {
  const fullTree = menuPermissions.value.map((menu) => ({
    ...menu,
    children: operationPermissions.value.filter((op) => op.parent === menu.code),
  }))

  if (!search.value) return fullTree

  const lowerSearch = search.value.toLowerCase()
  return fullTree
    .map((node) => {
      const nodeMatch = node.code.toLowerCase().includes(lowerSearch) || node.name.toLowerCase().includes(lowerSearch)
      const matchedChildren = node.children.filter(
        (c) => c.code.toLowerCase().includes(lowerSearch) || c.name.toLowerCase().includes(lowerSearch),
      )
      if (nodeMatch || matchedChildren.length > 0) {
        return {
          ...node,
          children: nodeMatch ? node.children : matchedChildren,
        }
      }
      return null
    })
    .filter(Boolean) as PermissionTreeNode[]
})

watch(search, () => {
  if (search.value) {
    expanded.value = new Set(tree.value.map((n) => n.code))
  }
})

function toggleExpand(code: string) {
  const next = new Set(expanded.value)
  if (next.has(code)) next.delete(code)
  else next.add(code)
  expanded.value = next
}

// Edit dialog
const editOpen = ref(false)
const editingItem = ref<Permission | null>(null)
const editParentCode = ref<string | null>(null)
const editForm = ref({ code: '', name: '', parent: '' })

function handleAddMenu() {
  editingItem.value = null
  editParentCode.value = null
  editForm.value = { code: '', name: '', parent: '' }
  editOpen.value = true
}

function handleAddOperation(parentCode: string) {
  editingItem.value = null
  editParentCode.value = parentCode
  editForm.value = { code: '', name: '', parent: parentCode }
  editOpen.value = true
}

function handleEdit(item: Permission, parentCode?: string) {
  editingItem.value = item
  editParentCode.value = parentCode ?? null
  editForm.value = { code: item.code, name: item.name, parent: item.parent ?? '' }
  editOpen.value = true
}

async function handleEditSubmit() {
  editSubmitting.value = true
  const isMenu = !editParentCode.value
  try {
    const res = editingItem.value
      ? await updatePermission(editingItem.value.code, {
          name: editForm.value.name,
          parent: isMenu ? undefined : editForm.value.parent || undefined,
        })
      : await createPermission({
          code: editForm.value.code,
          name: editForm.value.name,
          type: isMenu ? 'menu' : 'operation',
          parent: isMenu ? undefined : editForm.value.parent || undefined,
        })
    if (res.code === 0) {
      toast.success(editingItem.value ? '更新成功' : '创建成功')
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

// Delete dialog
const deleteOpen = ref(false)
const deleteTarget = ref<Permission | null>(null)
const deleteIsMenu = ref(false)

function handleDelete(item: Permission, isMenu: boolean) {
  deleteTarget.value = item
  deleteIsMenu.value = isMenu
  deleteOpen.value = true
}

async function handleDeleteConfirm() {
  deleteSubmitting.value = true
  try {
    if (deleteTarget.value) {
      const res = await deletePermission(deleteTarget.value.code)
      if (res.code === 0) {
        toast.success('删除成功')
        if (deleteIsMenu.value) {
          const next = new Set(expanded.value)
          next.delete(deleteTarget.value.code)
          expanded.value = next
        }
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
      <h1 class="text-2xl font-bold tracking-tight">权限管理</h1>
      <p class="text-base-content/50">管理系统的菜单权限和操作权限。</p>
    </div>

    <div v-if="tableLoading" class="skeleton h-96 w-full"></div>

    <div v-else class="card border border-base-content/10 rounded-xl">
      <div class="card-body">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 class="card-title">权限列表</h3>
            <p class="text-sm text-base-content/50">共 {{ menuPermissions.length }} 个菜单权限，{{ operationPermissions.length }} 个操作权限</p>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div class="relative w-full sm:w-64">
              <Search class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-base-content/50" />
              <input v-model="search" placeholder="搜索编码或名称..." class="input input-bordered input-sm w-full pl-8" />
            </div>
            <button v-if="auth.hasPermission('permissions.create')" class="btn btn-primary btn-sm" @click="handleAddMenu">
              <Plus class="size-4" />
              新增菜单
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th style="width: 40%">权限名称</th>
                <th style="width: 25%">权限编码</th>
                <th style="width: 10%">类型</th>
                <th class="text-right" style="width: 25%">操作</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="node in tree" :key="node.code">
                <tr class="bg-base-content/5">
                  <td>
                    <div class="flex items-center gap-2">
                      <button class="btn btn-ghost btn-xs" @click="toggleExpand(node.code)">
                        <ChevronRight
                          class="size-4 transition-transform duration-200"
                          :style="{ transform: expanded.has(node.code) ? 'rotate(90deg)' : 'rotate(0deg)' }"
                        />
                      </button>
                      <span class="font-medium">{{ node.name }}</span>
                    </div>
                  </td>
                  <td class="font-mono text-sm">{{ node.code }}</td>
                  <td><span class="badge badge-primary">菜单</span></td>
                  <td class="text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button v-if="auth.hasPermission('permissions.create')" class="btn btn-ghost btn-xs" @click="handleAddOperation(node.code)">
                        <Plus class="size-3" />
                      </button>
                      <button v-if="auth.hasPermission('permissions.edit')" class="btn btn-ghost btn-xs" @click="handleEdit(node)">
                        <Pencil class="size-3" />
                      </button>
                      <button v-if="auth.hasPermission('permissions.delete')" class="btn btn-ghost btn-xs" @click="handleDelete(node, true)">
                        <Trash2 class="size-3" />
                      </button>
                    </div>
                  </td>
                </tr>

                <template v-if="expanded.has(node.code)">
                  <tr v-for="child in node.children" :key="child.code">
                    <td>
                      <div class="flex items-center gap-2 pl-7">
                        <span>{{ child.name }}</span>
                      </div>
                    </td>
                    <td class="font-mono text-sm">{{ child.code }}</td>
                    <td><span class="badge badge-secondary">操作</span></td>
                    <td class="text-right">
                      <div class="flex items-center justify-end gap-1">
                        <button v-if="auth.hasPermission('permissions.edit')" class="btn btn-ghost btn-xs" @click="handleEdit(child, node.code)">
                          <Pencil class="size-3" />
                        </button>
                        <button v-if="auth.hasPermission('permissions.delete')" class="btn btn-ghost btn-xs" @click="handleDelete(child, false)">
                          <Trash2 class="size-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="node.children.length === 0">
                    <td colspan="4">
                      <div class="pl-7 text-sm text-base-content/50">暂无操作权限</div>
                    </td>
                  </tr>
                </template>
              </template>
              <tr v-if="tree.length === 0">
                <td colspan="4" class="text-center text-base-content/50">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Edit dialog -->
    <dialog :class="{ modal: true, 'modal-open': editOpen }" @close="editOpen = false">
      <div class="modal-box">
        <h3 class="text-lg font-bold">{{ editingItem ? '编辑权限' : editParentCode ? '新增操作权限' : '新增菜单权限' }}</h3>
        <p class="text-sm text-base-content/50">{{ editingItem ? '修改权限的基本信息。' : '填写以下信息创建新权限。' }}</p>
        <form @submit.prevent="handleEditSubmit">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">权限编码</legend>
            <input v-model="editForm.code" :placeholder="editParentCode ? '如：users.create' : '如：dashboard'" class="input input-bordered w-full" required :disabled="!!editingItem" />
          </fieldset>
          <fieldset class="fieldset mt-2">
            <legend class="fieldset-legend">权限名称</legend>
            <input v-model="editForm.name" placeholder="如：仪表盘" class="input input-bordered w-full" required />
          </fieldset>
          <fieldset v-if="editParentCode && !editingItem" class="fieldset mt-2">
            <legend class="fieldset-legend">所属菜单</legend>
            <select v-model="editForm.parent" class="select select-bordered w-full">
              <option v-for="perm in menuPermissions" :key="perm.code" :value="perm.code">{{ perm.name }}</option>
            </select>
          </fieldset>
          <div class="modal-action">
            <button type="button" class="btn" @click="editOpen = false">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="editSubmitting">
              <span v-if="editSubmitting" class="loading loading-spinner loading-sm"></span>
              {{ editingItem ? '保存' : '创建' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <ConfirmDeleteDialog
      :open="deleteOpen"
      :target-name="deleteTarget?.name || ''"
      :description="deleteIsMenu ? '该菜单下的所有操作权限也将被删除。' : undefined"
      :loading="deleteSubmitting"
      @update:open="deleteOpen = $event"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>
