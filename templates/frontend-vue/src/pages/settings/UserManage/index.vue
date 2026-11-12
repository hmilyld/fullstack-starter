<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import {
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserRound,
  Users,
} from "@lucide/vue"
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog.vue"
import BulkActionsBar from "@/components/shared/BulkActionsBar.vue"
import ColumnToggle from "@/components/shared/ColumnToggle.vue"
import DataList, { type DataColumn } from "@/components/shared/DataList.vue"
import FormDialog from "@/components/shared/FormDialog.vue"
import ListShell from "@/components/shared/ListShell.vue"
import LoadingButton from "@/components/shared/LoadingButton.vue"
import PageHeader from "@/components/shared/PageHeader.vue"
import RecordCard from "@/components/shared/RecordCard.vue"
import RoleBadge from "@/components/shared/RoleBadge.vue"
import RowActions from "@/components/shared/RowActions.vue"
import type { RowAction } from "@/components/shared/row-action"
import TablePagination from "@/components/shared/TablePagination.vue"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
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
  batchUpdateRole,
  createUser,
  deleteUser as apiDeleteUser,
  getUsers,
  resetPassword,
  updateUser,
} from "@/api/user"
import { getRoles } from "@/api/role"
import { useColumnVisibility } from "@/composables/use-column-visibility"
import { usePagedList } from "@/composables/use-paged-list"
import { useUrlListState } from "@/composables/use-url-list-state"
import { useDebouncedValue } from "@/composables/use-debounced-value"
import { useAuthStore } from "@/stores/auth"
import { useToast } from "@/composables/use-toast"
import type { Role } from "@/types/role"
import type { User } from "@/types/user"

const DEFAULT_PAGE_SIZE = 8
const PAGE_SIZE_OPTIONS = [8, 16, 32]

function generatePassword(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const values = new Uint32Array(length)
  crypto.getRandomValues(values)
  return Array.from(values, (value) => chars[value % chars.length]).join("")
}

const auth = useAuthStore()
const toast = useToast()
const roles = ref<Role[]>([])

const pageSize = ref(DEFAULT_PAGE_SIZE)
const { search, page, setSearch, setPage } = useUrlListState()
const debouncedSearch = useDebouncedValue(search)

const {
  items: users,
  total,
  page: currentPage,
  totalPages,
  loading: listLoading,
  error: listError,
  setPage: setListPage,
  refresh: refreshList,
} = usePagedList<User, { search: string }>({
  fetcher: getUsers,
  params: computed(() => ({ search: debouncedSearch.value })),
  pageSize,
  page,
  onPageChange: setPage,
})

onMounted(async () => {
  const res = await getRoles({ pageSize: 100 })
  if (res.code === 0) roles.value = res.data.list
})

const editOpen = ref(false)
const editingUser = ref<User | null>(null)
const editForm = ref({ username: "", name: "", email: "", roleId: "user" })
const editSubmitting = ref(false)

const roleOpen = ref(false)
const roleTarget = ref<User | null>(null)
const roleValue = ref("")
const roleSubmitting = ref(false)

const deleteOpen = ref(false)
const deleteTarget = ref<User | null>(null)
const deleteSubmitting = ref(false)

const pendingOpen = ref(false)
const pendingUsers = ref<User[]>([])
const selectedPending = ref<Set<string>>(new Set())
const pendingLoading = ref(false)
const pendingSubmitting = ref(false)
const rejectOpen = ref(false)

const resetOpen = ref(false)
const resetTarget = ref<User | null>(null)
const newPassword = ref("")
const resetSubmitting = ref(false)

function handleAdd() {
  editingUser.value = null
  editForm.value = { username: "", name: "", email: "", roleId: "user" }
  editOpen.value = true
}

function handleEdit(user: User) {
  editingUser.value = user
  editForm.value = {
    username: user.username,
    name: user.name,
    email: user.email,
    roleId: user.roleId,
  }
  editOpen.value = true
}

async function handleEditSubmit() {
  editSubmitting.value = true
  const payload = {
    username: editForm.value.username,
    name: editForm.value.name,
    email: editForm.value.email,
    roleId: editForm.value.roleId,
  }
  const res = editingUser.value
    ? await updateUser(editingUser.value.id, payload)
    : await createUser(payload)
  editSubmitting.value = false
  if (res.code !== 0) {
    toast.error(res.message || "操作失败")
    return
  }
  toast.success(editingUser.value ? "保存成功" : "创建成功")
  editOpen.value = false
  refreshList()
}

function handleRole(user: User) {
  roleTarget.value = user
  roleValue.value = user.roleId
  roleOpen.value = true
}

async function handleRoleSubmit() {
  if (!roleTarget.value) return
  roleSubmitting.value = true
  const res = await updateUser(roleTarget.value.id, { roleId: roleValue.value })
  roleSubmitting.value = false
  if (res.code !== 0) {
    toast.error(res.message || "操作失败")
    return
  }
  toast.success("角色已更新")
  roleOpen.value = false
  refreshList()
}

function handleDelete(user: User) {
  deleteTarget.value = user
  deleteOpen.value = true
}

async function handleDeleteConfirm() {
  if (!deleteTarget.value) return
  deleteSubmitting.value = true
  const res = await apiDeleteUser(deleteTarget.value.id)
  deleteSubmitting.value = false
  if (res.code !== 0) {
    toast.error(res.message || "删除失败")
    return
  }
  toast.success("删除成功")
  deleteOpen.value = false
  refreshList()
}

async function openPending() {
  pendingOpen.value = true
  pendingLoading.value = true
  selectedPending.value = new Set()
  const res = await getUsers({ pageSize: 100 })
  if (res.code === 0) {
    pendingUsers.value = res.data.list.filter(
      (user) => user.roleId === "pending_review"
    )
  } else {
    toast.error(res.message || "加载待审核用户失败")
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
    selectedPending.value = new Set(pendingUsers.value.map((user) => user.id))
  }
}

async function handleBatchApprove() {
  if (selectedPending.value.size === 0) return
  pendingSubmitting.value = true
  const res = await batchUpdateRole(
    Array.from(selectedPending.value, Number),
    "user"
  )
  pendingSubmitting.value = false
  if (res.code !== 0) {
    toast.error(res.message || "审核失败")
    return
  }
  toast.success(`已通过 ${selectedPending.value.size} 位用户审核`)
  pendingOpen.value = false
  refreshList()
}

async function handleBatchReject() {
  if (selectedPending.value.size === 0) return
  pendingSubmitting.value = true
  const results = await Promise.all(
    Array.from(selectedPending.value).map((id) => apiDeleteUser(id))
  )
  pendingSubmitting.value = false
  rejectOpen.value = false

  const failed = results.filter((res) => res.code !== 0).length
  if (failed > 0) {
    toast.error(`${failed} 位用户拒绝失败`)
    await openPending()
    return
  }

  toast.success(`已拒绝 ${selectedPending.value.size} 位用户`)
  pendingOpen.value = false
  refreshList()
}

function openReset(user: User) {
  resetTarget.value = user
  newPassword.value = generatePassword()
  resetOpen.value = true
}

async function handleResetSubmit() {
  if (!resetTarget.value) return
  resetSubmitting.value = true
  const res = await resetPassword(resetTarget.value.id, newPassword.value)
  resetSubmitting.value = false
  if (res.code !== 0) {
    toast.error(res.message || "重置失败")
    return
  }
  toast.success("密码已重置")
  resetOpen.value = false
}

async function copyPassword() {
  try {
    await navigator.clipboard.writeText(newPassword.value)
    toast.success("密码已复制到剪贴板")
  } catch {
    toast.error("复制失败，请手动复制")
  }
}

function buildUserActions(user: User): RowAction[] {
  const actions: RowAction[] = []
  if (auth.hasPermission("users.edit")) {
    actions.push({
      label: "编辑",
      icon: Pencil,
      onSelect: () => handleEdit(user),
    })
  }
  if (auth.hasPermission("users.assign_role")) {
    actions.push({
      label: "维护角色",
      icon: Shield,
      onSelect: () => handleRole(user),
    })
  }
  if (auth.hasPermission("users.edit")) {
    actions.push({
      label: "重置密码",
      icon: KeyRound,
      onSelect: () => openReset(user),
    })
  }
  if (auth.hasPermission("users.delete") && user.id !== auth.user?.id) {
    actions.push({
      label: "删除",
      icon: Trash2,
      destructive: true,
      separatorBefore: true,
      onSelect: () => handleDelete(user),
    })
  }
  return actions
}

const allPendingSelected = computed(
  () =>
    pendingUsers.value.length > 0 &&
    selectedPending.value.size === pendingUsers.value.length
)
const somePendingSelected = computed(
  () => selectedPending.value.size > 0 && !allPendingSelected.value
)
const pendingCheckboxState = computed(() => {
  if (allPendingSelected.value) return true
  if (somePendingSelected.value) return "indeterminate"
  return false
})
const selectedIds = ref<Set<string>>(new Set())
const bulkRoleOpen = ref(false)
const bulkRoleId = ref("user")
const bulkSubmitting = ref(false)

const pageIds = computed(() => users.value.map((user) => user.id))
const allSelected = computed(
  () =>
    pageIds.value.length > 0 &&
    pageIds.value.every((id) => selectedIds.value.has(id))
)
const someSelected = computed(
  () =>
    !allSelected.value && pageIds.value.some((id) => selectedIds.value.has(id))
)

watch([() => currentPage.value, debouncedSearch], () => {
  selectedIds.value = new Set()
})

function toggleSelected(id: string) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

function toggleAll(checked: boolean) {
  selectedIds.value = checked ? new Set(pageIds.value) : new Set()
}

async function handleBulkRoleSubmit() {
  if (selectedIds.value.size === 0) return
  bulkSubmitting.value = true
  const res = await batchUpdateRole(
    Array.from(selectedIds.value, Number),
    bulkRoleId.value
  )
  bulkSubmitting.value = false
  if (res.code !== 0) {
    toast.error(res.message || "批量操作失败")
    return
  }
  toast.success(`已更新 ${selectedIds.value.size} 位用户的角色`)
  bulkRoleOpen.value = false
  selectedIds.value = new Set()
  refreshList()
}

const columns: DataColumn[] = [
  { key: "select", header: "", headClass: "w-10" },
  { key: "username", header: "用户名" },
  {
    key: "name",
    header: "姓名",
    hideable: true,
    headClass: "hidden md:table-cell",
    cellClass: "hidden md:table-cell",
  },
  {
    key: "email",
    header: "邮箱",
    hideable: true,
    headClass: "hidden lg:table-cell",
    cellClass: "hidden text-muted-foreground lg:table-cell",
  },
  { key: "role", header: "角色" },
  {
    key: "actions",
    header: "操作",
    pinRight: true,
    headClass: "text-right",
    cellClass: "text-right",
  },
]

const { hidden, visibleColumns, toggle, reset } = useColumnVisibility(
  "users",
  columns
)

const pendingColumns: DataColumn[] = [
  { key: "select", header: "", headClass: "w-12" },
  { key: "username", header: "用户名" },
  { key: "name", header: "姓名" },
  { key: "email", header: "邮箱" },
]

const hasUsers = computed(() => users.value.length > 0)
</script>

<template>
  <div class="flex flex-col gap-(--page-gap)">
    <PageHeader title="用户管理" description="管理团队成员及其角色权限。" />

    <ListShell :description="`共 ${total} 位用户`">
      <template #actions>
        <InputGroup class="w-full md:w-64">
          <InputGroupInput
            name="q"
            autocomplete="off"
            :spellcheck="false"
            placeholder="搜索用户名、姓名或邮箱…"
            aria-label="搜索用户"
            :model-value="search"
            @update:model-value="setSearch(String($event))"
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <ColumnToggle
          :columns="columns"
          :hidden="hidden"
          @toggle="toggle"
          @reset="reset"
        />
        <Button
          v-if="auth.hasPermission('users.create')"
          class="w-full md:w-auto"
          @click="handleAdd"
        >
          <Plus data-icon="inline-start" />
          新增用户
        </Button>
        <Button
          v-if="auth.hasPermission('users.edit')"
          variant="outline"
          class="w-full md:w-auto"
          @click="openPending"
        >
          待审核
        </Button>
      </template>

      <template v-if="hasUsers" #footer>
        <TablePagination
          :page="currentPage"
          :total-pages="totalPages"
          :total="total"
          item-label="位用户"
          :page-size="pageSize"
          :page-size-options="PAGE_SIZE_OPTIONS"
          @page-change="setListPage"
          @page-size-change="
            (size) => {
              pageSize = size
              setListPage(1)
            }
          "
        />
      </template>

      <DataList
        :items="users"
        :loading="listLoading"
        :error="listError"
        :columns="visibleColumns"
        :skeleton-col-span="6"
        :empty="{
          icon: Users,
          title: debouncedSearch ? '没有匹配的用户' : '还没有用户',
          description: debouncedSearch
            ? '换个关键词，或清空搜索条件后再试。'
            : '创建第一位用户，或等待注册审核通过。',
        }"
        @retry="refreshList"
        @hide-column="toggle"
      >
        <template #empty-action>
          <Button
            v-if="debouncedSearch"
            variant="outline"
            @click="setSearch('')"
          >
            清空搜索
          </Button>
          <Button
            v-else-if="auth.hasPermission('users.create')"
            @click="handleAdd"
          >
            <Plus data-icon="inline-start" />
            新增用户
          </Button>
        </template>

        <template #card="{ row }">
          <RecordCard :subtitle="`@${row.username} · ${row.email}`">
            <template #leading>
              <Checkbox
                :model-value="selectedIds.has(row.id)"
                :aria-label="`选择 ${row.name}`"
                class="mt-0.5"
                @update:model-value="toggleSelected(row.id)"
              />
            </template>
            <template #title>
              <span class="flex items-center gap-2">
                <Avatar class="size-7">
                  <AvatarImage
                    v-if="row.avatar"
                    :src="row.avatar"
                    :alt="row.name"
                    :width="28"
                    :height="28"
                  />
                  <AvatarFallback>{{ row.name.slice(0, 1) }}</AvatarFallback>
                </Avatar>
                <span class="truncate">{{ row.name }}</span>
              </span>
            </template>
            <template #badges>
              <RoleBadge :role-id="row.roleId" :roles="roles" />
            </template>
            <template #actions>
              <RowActions :actions="buildUserActions(row)" />
            </template>
          </RecordCard>
        </template>

        <template #head-select>
          <Checkbox
            :model-value="
              allSelected ? true : someSelected ? 'indeterminate' : false
            "
            aria-label="全选当前页用户"
            @update:model-value="(value) => toggleAll(value === true)"
          />
        </template>
        <template #cell-select="{ row }">
          <Checkbox
            :model-value="selectedIds.has(row.id)"
            :aria-label="`选择 ${row.name}`"
            @update:model-value="toggleSelected(row.id)"
          />
        </template>

        <template #cell-username="{ row }">
          <div class="flex items-center gap-3">
            <Avatar class="size-8">
              <AvatarImage
                v-if="row.avatar"
                :src="row.avatar"
                :alt="row.name"
                :width="32"
                :height="32"
              />
              <AvatarFallback>{{ row.name.slice(0, 1) }}</AvatarFallback>
            </Avatar>
            <span class="text-sm font-medium">{{ row.username }}</span>
          </div>
        </template>
        <template #cell-name="{ row }">{{ row.name }}</template>
        <template #cell-email="{ row }">{{ row.email }}</template>
        <template #cell-role="{ row }">
          <RoleBadge :role-id="row.roleId" :roles="roles" />
        </template>
        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <Button
              v-if="auth.hasPermission('users.edit')"
              variant="ghost"
              size="icon-sm"
              @click="handleEdit(row)"
            >
              <Pencil />
              <span class="sr-only">编辑 {{ row.name }}</span>
            </Button>
            <RowActions
              :actions="
                buildUserActions(row).filter((item) => item.label !== '编辑')
              "
            />
          </div>
        </template>
      </DataList>
    </ListShell>

    <BulkActionsBar
      :count="selectedIds.size"
      entity-name="位用户"
      @clear="selectedIds = new Set()"
    >
      <Button
        v-if="auth.hasPermission('users.assign_role')"
        size="sm"
        @click="bulkRoleOpen = true"
      >
        批量维护角色
      </Button>
    </BulkActionsBar>

    <FormDialog
      :open="bulkRoleOpen"
      title="批量维护角色"
      :description="`将为已选的 ${selectedIds.size} 位用户设置同一角色。`"
      :submitting="bulkSubmitting"
      submit-label="保存"
      @update:open="bulkRoleOpen = $event"
      @submit="handleBulkRoleSubmit"
    >
      <FieldGroup>
        <Field>
          <FieldLabel for="bulk-role">角色</FieldLabel>
          <Select v-model="bulkRoleId">
            <SelectTrigger id="bulk-role" class="w-full" aria-label="角色">
              <SelectValue placeholder="请选择角色" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
    </FormDialog>

    <FormDialog
      :open="editOpen"
      :title="editingUser ? '编辑用户' : '新增用户'"
      :description="
        editingUser ? '修改用户的基本信息。' : '填写以下信息创建新用户。'
      "
      :submitting="editSubmitting"
      :submit-label="editingUser ? '保存' : '创建'"
      @update:open="editOpen = $event"
      @submit="handleEditSubmit"
    >
      <FieldGroup>
        <Field>
          <FieldLabel for="username">用户名</FieldLabel>
          <Input
            id="username"
            v-model="editForm.username"
            name="username"
            autocomplete="off"
            :spellcheck="false"
            placeholder="请输入用户名"
            required
          />
        </Field>
        <Field>
          <FieldLabel for="name">姓名</FieldLabel>
          <Input
            id="name"
            v-model="editForm.name"
            name="name"
            autocomplete="off"
            placeholder="请输入姓名"
            required
          />
        </Field>
        <Field>
          <FieldLabel for="email">邮箱</FieldLabel>
          <Input
            id="email"
            v-model="editForm.email"
            name="email"
            autocomplete="off"
            :spellcheck="false"
            type="email"
            placeholder="请输入邮箱"
            required
          />
        </Field>
        <Field v-if="auth.hasPermission('users.assign_role')">
          <FieldLabel>角色</FieldLabel>
          <Select v-model="editForm.roleId">
            <SelectTrigger class="w-full" aria-label="角色">
              <SelectValue placeholder="请选择角色" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="role in roles"
                  :key="role.id"
                  :value="role.id"
                >
                  {{ role.name }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
    </FormDialog>

    <FormDialog
      :open="roleOpen"
      title="维护角色"
      :submitting="roleSubmitting"
      submit-label="确认修改"
      @update:open="roleOpen = $event"
      @submit="handleRoleSubmit"
    >
      <template #description>
        为
        <span class="font-medium text-foreground">{{ roleTarget?.name }}</span>
        修改角色。
      </template>
      <FieldGroup>
        <Field>
          <FieldLabel>当前角色</FieldLabel>
          <div>
            <RoleBadge
              v-if="roleTarget"
              :role-id="roleTarget.roleId"
              :roles="roles"
            />
          </div>
        </Field>
        <Field>
          <FieldLabel>新角色</FieldLabel>
          <Select v-model="roleValue">
            <SelectTrigger class="w-full" aria-label="新角色">
              <SelectValue placeholder="请选择角色" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="role in roles"
                  :key="role.id"
                  :value="role.id"
                >
                  {{ role.name }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
    </FormDialog>

    <ConfirmDeleteDialog
      :open="deleteOpen"
      :target-name="deleteTarget?.name ?? ''"
      :loading="deleteSubmitting"
      @update:open="deleteOpen = $event"
      @confirm="handleDeleteConfirm"
    />

    <Dialog :open="resetOpen" @update:open="resetOpen = $event">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>重置密码</DialogTitle>
          <DialogDescription>
            为 <span class="font-medium">{{ resetTarget?.name }}</span> 重置密码
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel>新密码</FieldLabel>
            <div class="flex gap-2">
              <Input
                name="newPassword"
                autocomplete="off"
                :model-value="newPassword"
                readonly
                class="font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                aria-label="重新生成密码"
                @click="newPassword = generatePassword()"
              >
                <RefreshCw />
              </Button>
              <Button variant="outline" @click="copyPassword">复制</Button>
            </div>
            <p class="text-sm text-muted-foreground">请将密码发送给用户。</p>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <LoadingButton :loading="resetSubmitting" @click="handleResetSubmit">
            确认重置
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog :open="pendingOpen" @update:open="pendingOpen = $event">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>待审核用户</DialogTitle>
          <DialogDescription>
            共 {{ pendingUsers.length }} 位用户等待审核，已选择
            {{ selectedPending.size }} 位。
          </DialogDescription>
        </DialogHeader>
        <DataList
          :items="pendingUsers"
          :loading="pendingLoading"
          :error="null"
          :columns="pendingColumns"
          :skeleton-col-span="4"
          :sticky-header="false"
          :bordered="false"
          :empty="{
            icon: UserRound,
            title: '暂无待审核用户',
            description: '开启人工审核后，新注册用户会出现在这里。',
          }"
          @retry="openPending"
        >
          <template #head-select>
            <Checkbox
              :model-value="pendingCheckboxState"
              aria-label="选择全部待审核用户"
              @update:model-value="toggleAllPending"
            />
          </template>
          <template #cell-select="{ row }">
            <Checkbox
              :model-value="selectedPending.has(row.id)"
              :aria-label="`选择 ${row.name}`"
              @update:model-value="togglePending(row.id)"
            />
          </template>
          <template #cell-username="{ row }">{{ row.username }}</template>
          <template #cell-name="{ row }">{{ row.name }}</template>
          <template #cell-email="{ row }">{{ row.email }}</template>
          <template #card="{ row }">
            <RecordCard
              :title="row.name"
              :subtitle="`@${row.username} · ${row.email}`"
            >
              <template #leading>
                <Checkbox
                  :model-value="selectedPending.has(row.id)"
                  :aria-label="`选择 ${row.name}`"
                  class="mt-0.5"
                  @update:model-value="togglePending(row.id)"
                />
              </template>
            </RecordCard>
          </template>
        </DataList>
        <DialogFooter class="gap-2">
          <Button
            variant="destructive"
            :disabled="selectedPending.size === 0 || pendingSubmitting"
            @click="rejectOpen = true"
          >
            拒绝 ({{ selectedPending.size }})
          </Button>
          <LoadingButton
            :disabled="selectedPending.size === 0"
            :loading="pendingSubmitting"
            @click="handleBatchApprove"
          >
            通过 ({{ selectedPending.size }})
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDeleteDialog
      :open="rejectOpen"
      :target-name="`选中的 ${selectedPending.size} 位用户`"
      description="拒绝后这些账号会被删除。"
      :loading="pendingSubmitting"
      @update:open="rejectOpen = $event"
      @confirm="handleBatchReject"
    />
  </div>
</template>
