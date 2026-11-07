<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
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
import EmptyState from "@/components/shared/EmptyState.vue"
import ErrorState from "@/components/shared/ErrorState.vue"
import FormDialog from "@/components/shared/FormDialog.vue"
import InlineError from "@/components/shared/InlineError.vue"
import ListShell from "@/components/shared/ListShell.vue"
import LoadingButton from "@/components/shared/LoadingButton.vue"
import PageHeader from "@/components/shared/PageHeader.vue"
import RecordCard from "@/components/shared/RecordCard.vue"
import RoleBadge from "@/components/shared/RoleBadge.vue"
import RowActions from "@/components/shared/RowActions.vue"
import type { RowAction } from "@/components/shared/row-action"
import TablePagination from "@/components/shared/TablePagination.vue"
import TableSkeletonRow from "@/components/shared/TableSkeletonRow.vue"
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
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  batchUpdateRole,
  createUser,
  deleteUser as apiDeleteUser,
  getUsers,
  resetPassword,
  updateUser,
} from "@/api/user"
import { getRoles } from "@/api/role"
import { usePagedList } from "@/composables/use-paged-list"
import { useUrlListState } from "@/composables/use-url-list-state"
import { useDebouncedValue } from "@/composables/use-debounced-value"
import { useAuthStore } from "@/stores/auth"
import { useToast } from "@/composables/use-toast"
import type { Role } from "@/types/role"
import type { User } from "@/types/user"

const PAGE_SIZE = 8

function generatePassword(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const values = new Uint32Array(length)
  crypto.getRandomValues(values)
  return Array.from(values, (value) => chars[value % chars.length]).join("")
}

const auth = useAuthStore()
const toast = useToast()
const roles = ref<Role[]>([])

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
  pageSize: PAGE_SIZE,
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
const hasUsers = computed(() => users.value.length > 0)
const showEmpty = computed(() => !listLoading.value && !hasUsers.value)
</script>

<template>
  <div class="flex flex-col gap-(--page-gap)">
    <PageHeader title="用户管理" description="管理团队成员及其角色权限。" />

    <ListShell title="用户列表" :description="`共 ${total} 位用户`">
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

      <template #footer>
        <TablePagination
          v-if="hasUsers"
          :page="currentPage"
          :total-pages="totalPages"
          :total="total"
          item-label="位用户"
          @page-change="setListPage"
        />
      </template>

      <InlineError
        v-if="listError && hasUsers"
        :message="listError"
        :on-retry="refreshList"
      />

      <TableSkeletonRow v-if="listLoading && !hasUsers" :col-span="5" />
      <ErrorState
        v-else-if="listError && !hasUsers"
        :message="listError"
        :on-retry="refreshList"
      />
      <EmptyState
        v-else-if="showEmpty"
        :icon="Users"
        :title="debouncedSearch ? '没有匹配的用户' : '还没有用户'"
        :description="
          debouncedSearch
            ? '换个关键词，或清空搜索条件后再试。'
            : '创建第一位用户，或等待注册审核通过。'
        "
      >
        <template #action>
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
      </EmptyState>

      <template v-else>
        <div class="flex flex-col gap-2 md:hidden">
          <RecordCard
            v-for="user in users"
            :key="user.id"
            :subtitle="`@${user.username} · ${user.email}`"
          >
            <template #title>
              <span class="flex items-center gap-2">
                <Avatar class="size-7">
                  <AvatarImage
                    v-if="user.avatar"
                    :src="user.avatar"
                    :alt="user.name"
                    :width="28"
                    :height="28"
                  />
                  <AvatarFallback>{{ user.name.slice(0, 1) }}</AvatarFallback>
                </Avatar>
                <span class="truncate">{{ user.name }}</span>
              </span>
            </template>
            <template #badges>
              <RoleBadge :role-id="user.roleId" :roles="roles" />
            </template>
            <template #actions>
              <RowActions :actions="buildUserActions(user)" />
            </template>
          </RecordCard>
        </div>

        <div class="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户名</TableHead>
                <TableHead class="hidden md:table-cell">姓名</TableHead>
                <TableHead class="hidden lg:table-cell">邮箱</TableHead>
                <TableHead>角色</TableHead>
                <TableHead class="sticky right-0 bg-card text-right">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="user in users" :key="user.id">
                <TableCell>
                  <div class="flex items-center gap-3">
                    <Avatar class="size-8">
                      <AvatarImage
                        v-if="user.avatar"
                        :src="user.avatar"
                        :alt="user.name"
                        :width="32"
                        :height="32"
                      />
                      <AvatarFallback>{{
                        user.name.slice(0, 1)
                      }}</AvatarFallback>
                    </Avatar>
                    <span class="text-sm font-medium">{{ user.username }}</span>
                  </div>
                </TableCell>
                <TableCell class="hidden md:table-cell">
                  {{ user.name }}
                </TableCell>
                <TableCell class="hidden text-muted-foreground lg:table-cell">
                  {{ user.email }}
                </TableCell>
                <TableCell>
                  <RoleBadge :role-id="user.roleId" :roles="roles" />
                </TableCell>
                <TableCell class="sticky right-0 bg-inherit text-right">
                  <div class="flex items-center justify-end gap-1">
                    <Button
                      v-if="auth.hasPermission('users.edit')"
                      variant="ghost"
                      size="icon-sm"
                      @click="handleEdit(user)"
                    >
                      <Pencil />
                      <span class="sr-only">编辑 {{ user.name }}</span>
                    </Button>
                    <Button
                      v-if="auth.hasPermission('users.assign_role')"
                      variant="ghost"
                      size="icon-sm"
                      @click="handleRole(user)"
                    >
                      <Shield />
                      <span class="sr-only">维护角色</span>
                    </Button>
                    <Button
                      v-if="auth.hasPermission('users.edit')"
                      variant="ghost"
                      size="icon-sm"
                      @click="openReset(user)"
                    >
                      <KeyRound />
                      <span class="sr-only">重置密码</span>
                    </Button>
                    <Button
                      v-if="
                        auth.hasPermission('users.delete') &&
                        user.id !== auth.user?.id
                      "
                      variant="ghost"
                      size="icon-sm"
                      @click="handleDelete(user)"
                    >
                      <Trash2 />
                      <span class="sr-only">删除</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </template>
    </ListShell>

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
        <div class="max-h-[400px] overflow-auto">
          <div
            v-if="pendingLoading"
            class="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"
          >
            <Spinner />
            加载中…
          </div>
          <EmptyState
            v-else-if="pendingUsers.length === 0"
            :icon="UserRound"
            title="暂无待审核用户"
            description="开启人工审核后，新注册用户会出现在这里。"
          />
          <Table v-else>
            <TableHeader>
              <TableRow>
                <TableHead class="w-12">
                  <Checkbox
                    :model-value="pendingCheckboxState"
                    aria-label="选择全部待审核用户"
                    @update:model-value="toggleAllPending"
                  />
                </TableHead>
                <TableHead>用户名</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>邮箱</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="user in pendingUsers" :key="user.id">
                <TableCell>
                  <Checkbox
                    :model-value="selectedPending.has(user.id)"
                    :aria-label="`选择 ${user.name}`"
                    @update:model-value="togglePending(user.id)"
                  />
                </TableCell>
                <TableCell>{{ user.username }}</TableCell>
                <TableCell>{{ user.name }}</TableCell>
                <TableCell>{{ user.email }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
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
