<script setup lang="ts">
import { ref, watch, onMounted, computed, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getUsers, createUser, updateUser, deleteUser, getRoles, resetPassword, batchUpdateRole } from '@/lib/api'
import type { User, Role } from '@/types/api'
import { useToast } from '@/composables/use-toast'
import Pagination from '@/components/shared/Pagination.vue'
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog.vue'
import PageSkeleton from '@/components/shared/PageSkeleton.vue'
import { Pencil, Shield, Trash2, KeyRound, Plus, Search } from 'lucide-vue-next'

const auth = useAuthStore()
const toast = useToast()

const PAGE_SIZE = 8

const users = ref<User[]>([])
const roles = ref<Role[]>([])
const search = ref('')
const page = ref(1)
const total = ref(0)
const tableLoading = ref(true)
const totalPages = ref(1)

const roleMap = computed(() => {
  const map = new Map<string, string>()
  for (const role of roles.value) {
    map.set(role.id, role.name)
  }
  return map
})

onMounted(async () => {
  const res = await getRoles({ pageSize: 100 })
  if (res.code === 0) roles.value = res.data.list
  loadData()
})

async function loadData() {
  tableLoading.value = true
  const res = await getUsers({ search: search.value, page: page.value, pageSize: PAGE_SIZE })
  if (res.code === 0) {
    users.value = res.data.list
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

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer)
})

function findRoleName(roleId: string): string {
  return roleMap.value.get(roleId) ?? '未知角色'
}

function getRoleBadgeClass(roleId: string) {
  if (roleId === 'admin') return 'badge badge-primary'
  if (roleId === 'user') return 'badge badge-secondary'
  return 'badge badge-outline'
}

// Edit dialog
const editOpen = ref(false)
const editingUser = ref<User | null>(null)
const editForm = ref({ username: '', name: '', email: '', roleId: 'user' })
const editSubmitting = ref(false)

function handleAdd() {
  editingUser.value = null
  editForm.value = { username: '', name: '', email: '', roleId: 'user' }
  editOpen.value = true
}

function handleEdit(user: User) {
  editingUser.value = user
  editForm.value = { username: user.username, name: user.name, email: user.email, roleId: user.roleId }
  editOpen.value = true
}

async function handleEditSubmit() {
  editSubmitting.value = true
  try {
    const res = editingUser.value
      ? await updateUser(editingUser.value.id, editForm.value)
      : await createUser(editForm.value)
    if (res.code === 0) {
      toast.success(editingUser.value ? '更新成功' : '创建成功')
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

// Role dialog
const roleOpen = ref(false)
const roleTarget = ref<User | null>(null)
const roleValue = ref('')
const roleSubmitting = ref(false)

function handleRole(user: User) {
  roleTarget.value = user
  roleValue.value = user.roleId
  roleOpen.value = true
}

async function handleRoleSubmit() {
  roleSubmitting.value = true
  try {
    if (roleTarget.value) {
      const res = await updateUser(roleTarget.value.id, { roleId: roleValue.value })
      if (res.code === 0) {
        toast.success('角色修改成功')
        roleOpen.value = false
        loadData()
      } else {
        toast.error(res.message || '修改失败')
      }
    }
  } catch {
    toast.error('网络请求失败')
  }
  roleSubmitting.value = false
}

// Delete dialog
const deleteOpen = ref(false)
const deleteTarget = ref<User | null>(null)
const deleteSubmitting = ref(false)

function handleDelete(user: User) {
  deleteTarget.value = user
  deleteOpen.value = true
}

async function handleDeleteConfirm() {
  deleteSubmitting.value = true
  try {
    if (deleteTarget.value) {
      const res = await deleteUser(deleteTarget.value.id)
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

// Reset password dialog
const resetOpen = ref(false)
const resetTarget = ref<User | null>(null)
const newPassword = ref('')
const resetSubmitting = ref(false)

function openReset(user: User) {
  resetTarget.value = user
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let pwd = ''
  for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length))
  newPassword.value = pwd
  resetOpen.value = true
}

async function handleResetSubmit() {
  if (!resetTarget.value) return
  resetSubmitting.value = true
  try {
    const res = await resetPassword(resetTarget.value.id, newPassword.value)
    if (res.code === 0) {
      toast.success('密码重置成功')
      resetOpen.value = false
      loadData()
    } else {
      toast.error(res.message || '重置失败')
    }
  } catch {
    toast.error('网络请求失败')
  }
  resetSubmitting.value = false
}

// Pending review dialog
const pendingOpen = ref(false)
const pendingUsers = ref<User[]>([])
const selectedPending = ref<Set<string>>(new Set())
const pendingLoading = ref(false)
const pendingSubmitting = ref(false)

async function openPending() {
  pendingOpen.value = true
  pendingLoading.value = true
  selectedPending.value = new Set()
  const res = await getUsers({ pageSize: 100 })
  if (res.code === 0) {
    pendingUsers.value = res.data.list.filter((u) => u.roleId === 'pending_review')
  }
  pendingLoading.value = false
}

function togglePending(id: string) {
  const next = new Set(selectedPending.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedPending.value = next
}

function toggleAllPending() {
  if (selectedPending.value.size === pendingUsers.value.length) {
    selectedPending.value = new Set()
  } else {
    selectedPending.value = new Set(pendingUsers.value.map((u) => u.id))
  }
}

async function handleBatchApprove() {
  if (selectedPending.value.size === 0) return
  pendingSubmitting.value = true
  try {
    const userIds = Array.from(selectedPending.value).map(Number)
    const res = await batchUpdateRole(userIds, 'user')
    if (res.code === 0) {
      toast.success(`已通过 ${userIds.length} 位用户审核`)
      pendingOpen.value = false
      loadData()
    } else {
      toast.error(res.message || '操作失败')
    }
  } catch {
    toast.error('网络请求失败')
  }
  pendingSubmitting.value = false
}

async function handleBatchReject() {
  if (selectedPending.value.size === 0) return
  pendingSubmitting.value = true
  try {
    for (const id of selectedPending.value) {
      await deleteUser(id)
    }
    toast.success(`已拒绝 ${selectedPending.value.size} 位用户`)
    pendingOpen.value = false
    loadData()
  } catch {
    toast.error('网络请求失败')
  }
  pendingSubmitting.value = false
}

function copyPassword() {
  try {
    navigator.clipboard.writeText(newPassword.value)
    toast.success('密码已复制到剪贴板')
  } catch {
    toast.error('复制失败，请手动复制')
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">用户管理</h1>
      <p class="text-base-content/50">管理团队成员及其角色权限。</p>
    </div>

    <PageSkeleton v-if="tableLoading" :cols="5" />

    <div v-else class="card border border-base-content/10 rounded-xl">
      <div class="card-body">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 class="card-title">用户列表</h3>
            <p class="text-sm text-base-content/50">共 {{ users.length }} 位用户</p>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div class="relative w-full sm:w-64">
              <Search class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-base-content/50" />
              <input v-model="search" placeholder="搜索用户名、姓名或邮箱..." class="input input-bordered input-sm w-full pl-8" />
            </div>
            <button v-if="auth.hasPermission('users.create')" class="btn btn-primary btn-sm" @click="handleAdd">
              <Plus class="size-4" />
              新增用户
            </button>
            <button v-if="auth.hasPermission('users.edit')" class="btn btn-outline btn-sm" @click="openPending">待审核</button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>用户名</th>
                <th>姓名</th>
                <th>邮箱</th>
                <th>角色</th>
                <th class="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>
                  <div class="flex items-center gap-3">
                    <div class="avatar avatar-placeholder size-8">
                      <div class="w-8 rounded-lg bg-neutral text-neutral-content">
                        <span>{{ user.name?.charAt(0) }}</span>
                      </div>
                    </div>
                    <span class="text-sm font-medium">{{ user.username }}</span>
                  </div>
                </td>
                <td>{{ user.name }}</td>
                <td class="text-base-content/50">{{ user.email }}</td>
                <td>
                  <span :class="getRoleBadgeClass(user.roleId)">{{ findRoleName(user.roleId) }}</span>
                </td>
                <td class="text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button v-if="auth.hasPermission('users.edit')" class="btn btn-ghost btn-xs" @click="handleEdit(user)">
                      <Pencil class="size-3" />
                    </button>
                    <button v-if="auth.hasPermission('users.assign_role')" class="btn btn-ghost btn-xs" @click="handleRole(user)">
                      <Shield class="size-3" />
                    </button>
                    <button v-if="auth.hasPermission('users.delete')" class="btn btn-ghost btn-xs" @click="handleDelete(user)">
                      <Trash2 class="size-3" />
                    </button>
                    <button v-if="auth.hasPermission('users.edit')" class="btn btn-ghost btn-xs" @click="openReset(user)">
                      <KeyRound class="size-3" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="users.length === 0">
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
      <div class="modal-box">
        <h3 class="text-lg font-bold">{{ editingUser ? '编辑用户' : '新增用户' }}</h3>
        <p class="text-sm text-base-content/50">{{ editingUser ? '修改用户的基本信息。' : '填写以下信息创建新用户。' }}</p>
        <form @submit.prevent="handleEditSubmit" class="flex flex-col gap-3">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">用户名</legend>
            <input v-model="editForm.username" placeholder="请输入用户名" class="input input-bordered w-full" required />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">姓名</legend>
            <input v-model="editForm.name" placeholder="请输入姓名" class="input input-bordered w-full" required />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">邮箱</legend>
            <input v-model="editForm.email" type="email" placeholder="请输入邮箱" class="input input-bordered w-full" required />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">角色</legend>
            <select v-model="editForm.roleId" class="select select-bordered w-full">
              <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
            </select>
          </fieldset>
          <div class="modal-action">
            <button type="button" class="btn" @click="editOpen = false">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="editSubmitting">
              <span v-if="editSubmitting" class="loading loading-spinner loading-sm"></span>
              {{ editingUser ? '保存' : '创建' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <!-- Role dialog -->
    <dialog :class="{ modal: true, 'modal-open': roleOpen }" @close="roleOpen = false">
      <div class="modal-box">
        <h3 class="text-lg font-bold">维护角色</h3>
        <p class="text-sm text-base-content/50">为 <span class="font-bold">{{ roleTarget?.name }}</span> 修改角色。</p>
        <div class="flex flex-col gap-4 py-2">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">当前角色</legend>
            <span :class="getRoleBadgeClass(roleTarget?.roleId || '')">{{ findRoleName(roleTarget?.roleId || '') }}</span>
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">新角色</legend>
            <select v-model="roleValue" class="select select-bordered w-full">
              <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
            </select>
          </fieldset>
        </div>
        <div class="modal-action">
          <button class="btn" @click="roleOpen = false">取消</button>
          <button class="btn btn-primary" :disabled="roleSubmitting" @click="handleRoleSubmit">
            <span v-if="roleSubmitting" class="loading loading-spinner loading-sm"></span>
            确认修改
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <!-- Reset password dialog -->
    <dialog :class="{ modal: true, 'modal-open': resetOpen }" @close="resetOpen = false">
      <div class="modal-box">
        <h3 class="text-lg font-bold">重置密码</h3>
        <p class="text-sm text-base-content/50">为 <span class="font-bold">{{ resetTarget?.name }}</span> 重置密码</p>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">新密码</legend>
          <div class="flex gap-2">
            <input :value="newPassword" readonly class="input input-bordered w-full" />
            <button type="button" class="btn btn-outline" @click="copyPassword">复制</button>
          </div>
          <div class="label">请将密码发送给用户。</div>
        </fieldset>
        <div class="modal-action">
          <button class="btn" @click="resetOpen = false">取消</button>
          <button class="btn btn-primary" :disabled="resetSubmitting" @click="handleResetSubmit">
            <span v-if="resetSubmitting" class="loading loading-spinner loading-sm"></span>
            确认重置
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <!-- Pending review dialog -->
    <dialog :class="{ modal: true, 'modal-open': pendingOpen }" @close="pendingOpen = false">
      <div class="modal-box max-w-2xl">
        <h3 class="text-lg font-bold">待审核用户</h3>
        <p class="text-sm text-base-content/50">共 {{ pendingUsers.length }} 位用户等待审核，已选择 {{ selectedPending.size }} 位。</p>
        <div class="max-h-[400px] overflow-auto">
          <div v-if="pendingLoading" class="py-8 text-center text-base-content/50">加载中...</div>
          <div v-else-if="pendingUsers.length === 0" class="py-8 text-center text-base-content/50">暂无待审核用户</div>
          <table v-else class="table table-zebra">
            <thead>
              <tr>
                <th class="w-12">
                  <input type="checkbox" class="checkbox checkbox-sm" :checked="selectedPending.size === pendingUsers.length && pendingUsers.length > 0" @change="toggleAllPending" />
                </th>
                <th>用户名</th>
                <th>姓名</th>
                <th>邮箱</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in pendingUsers" :key="user.id">
                <td>
                  <input type="checkbox" class="checkbox checkbox-sm" :checked="selectedPending.has(user.id)" @change="togglePending(user.id)" />
                </td>
                <td>{{ user.username }}</td>
                <td>{{ user.name }}</td>
                <td>{{ user.email }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-action">
          <button class="btn" @click="pendingOpen = false">取消</button>
          <button class="btn btn-error" :disabled="selectedPending.size === 0 || pendingSubmitting" @click="handleBatchReject">
            拒绝 ({{ selectedPending.size }})
          </button>
          <button class="btn btn-primary" :disabled="selectedPending.size === 0 || pendingSubmitting" @click="handleBatchApprove">
            <span v-if="pendingSubmitting" class="loading loading-spinner loading-sm"></span>
            通过 ({{ selectedPending.size }})
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <ConfirmDeleteDialog
      :open="deleteOpen"
      :target-name="deleteTarget?.name || ''"
      :loading="deleteSubmitting"
      @update:open="deleteOpen = $event"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>
