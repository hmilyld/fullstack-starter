<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
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
import DensityToggle from "@/components/shared/DensityToggle.vue"
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
import { useTableDensity } from "@/composables/use-table-density"
import { usePagedList } from "@/composables/use-paged-list"
import { useUrlListState } from "@/composables/use-url-list-state"
import { useDebouncedValue } from "@/composables/use-debounced-value"
import { useAuthStore } from "@/stores/auth"
import { useToast } from "@/composables/use-toast"
import type { Role } from "@/types/role"
import type { User } from "@/types/user"
import { translateOr } from "@/lib/label"

const DEFAULT_PAGE_SIZE = 8
const PAGE_SIZE_OPTIONS = [8, 16, 32]

function generatePassword(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const values = new Uint32Array(length)
  crypto.getRandomValues(values)
  return Array.from(values, (value) => chars[value % chars.length]).join("")
}

const { t } = useI18n()
const auth = useAuthStore()
const toast = useToast()
const roles = ref<Role[]>([])

function roleLabel(role: Role) {
  return translateOr(`roles.${role.id}`, role.name)
}

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
    toast.error(res.message || t("users.toasts.operationFailed"))
    return
  }
  toast.success(
    editingUser.value
      ? t("users.toasts.saveSuccess")
      : t("users.toasts.createSuccess")
  )
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
    toast.error(res.message || t("users.toasts.operationFailed"))
    return
  }
  toast.success(t("users.toasts.roleUpdated"))
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
    toast.error(res.message || t("users.toasts.deleteFailed"))
    return
  }
  toast.success(t("users.toasts.deleteSuccess"))
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
    toast.error(res.message || t("users.toasts.pendingLoadFailed"))
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
    toast.error(res.message || t("users.toasts.reviewFailed"))
    return
  }
  toast.success(
    t("users.toasts.approveSuccess", { count: selectedPending.value.size })
  )
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
    toast.error(t("users.toasts.rejectFailed", { count: failed }))
    await openPending()
    return
  }

  toast.success(
    t("users.toasts.rejectSuccess", { count: selectedPending.value.size })
  )
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
    toast.error(res.message || t("users.toasts.resetFailed"))
    return
  }
  toast.success(t("users.toasts.resetSuccess"))
  resetOpen.value = false
}

async function copyPassword() {
  try {
    await navigator.clipboard.writeText(newPassword.value)
    toast.success(t("users.toasts.passwordCopied"))
  } catch {
    toast.error(t("users.toasts.copyFailed"))
  }
}

function buildUserActions(user: User): RowAction[] {
  const actions: RowAction[] = []
  if (auth.hasPermission("users.edit")) {
    actions.push({
      label: t("users.actions.edit"),
      icon: Pencil,
      onSelect: () => handleEdit(user),
    })
  }
  if (auth.hasPermission("users.assign_role")) {
    actions.push({
      label: t("users.actions.role"),
      icon: Shield,
      onSelect: () => handleRole(user),
    })
  }
  if (auth.hasPermission("users.edit")) {
    actions.push({
      label: t("users.actions.reset"),
      icon: KeyRound,
      onSelect: () => openReset(user),
    })
  }
  if (auth.hasPermission("users.delete") && user.id !== auth.user?.id) {
    actions.push({
      label: t("users.actions.delete"),
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
    toast.error(res.message || t("users.toasts.bulkFailed"))
    return
  }
  toast.success(
    t("users.toasts.bulkRoleSuccess", { count: selectedIds.value.size })
  )
  bulkRoleOpen.value = false
  selectedIds.value = new Set()
  refreshList()
}

const columns = computed<DataColumn[]>(() => [
  { key: "select", header: "", headClass: "w-10" },
  { key: "username", header: t("users.headers.username") },
  {
    key: "name",
    header: t("users.headers.name"),
    hideable: true,
    headClass: "hidden md:table-cell",
    cellClass: "hidden md:table-cell",
  },
  {
    key: "email",
    header: t("users.headers.email"),
    hideable: true,
    headClass: "hidden lg:table-cell",
    cellClass: "hidden text-muted-foreground lg:table-cell",
  },
  { key: "role", header: t("users.headers.role") },
  {
    key: "actions",
    header: t("users.headers.actions"),
    pinRight: true,
    headClass: "text-right",
    cellClass: "text-right",
  },
])

const { hidden, visibleColumns, toggle, reset } = useColumnVisibility(
  "users",
  columns
)
const { density, setDensity } = useTableDensity("users")

const pendingColumns = computed<DataColumn[]>(() => [
  { key: "select", header: "", headClass: "w-12" },
  { key: "username", header: t("users.headers.username") },
  { key: "name", header: t("users.headers.name") },
  { key: "email", header: t("users.headers.email") },
])

const hasUsers = computed(() => users.value.length > 0)
</script>

<template>
  <div class="flex flex-col gap-(--page-gap)">
    <PageHeader
      :title="t('users.title')"
      :description="t('users.description')"
    />

    <ListShell :description="t('users.listDescription', { total })">
      <template #actions>
        <InputGroup class="w-full md:w-64">
          <InputGroupInput
            name="q"
            autocomplete="off"
            :spellcheck="false"
            :placeholder="t('users.searchPlaceholder')"
            :aria-label="t('users.searchAria')"
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
        <DensityToggle :density="density" @change="setDensity" />
        <Button
          v-if="auth.hasPermission('users.create')"
          class="w-full md:w-auto"
          @click="handleAdd"
        >
          <Plus data-icon="inline-start" />
          {{ t("users.addUser") }}
        </Button>
        <Button
          v-if="auth.hasPermission('users.edit')"
          variant="outline"
          class="w-full md:w-auto"
          @click="openPending"
        >
          {{ t("users.pendingReview") }}
        </Button>
      </template>

      <template v-if="hasUsers" #footer>
        <TablePagination
          :page="currentPage"
          :total-pages="totalPages"
          :total="total"
          :item-label="t('users.entityName')"
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
        :density="density"
        :skeleton-col-span="6"
        :empty="{
          icon: Users,
          title: debouncedSearch
            ? t('users.emptySearchTitle')
            : t('users.emptyTitle'),
          description: debouncedSearch
            ? t('users.emptySearchDescription')
            : t('users.emptyDescription'),
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
            {{ t("users.clearSearch") }}
          </Button>
          <Button
            v-else-if="auth.hasPermission('users.create')"
            @click="handleAdd"
          >
            <Plus data-icon="inline-start" />
            {{ t("users.addUser") }}
          </Button>
        </template>

        <template #card="{ row }">
          <RecordCard :subtitle="`@${row.username} · ${row.email}`">
            <template #leading>
              <Checkbox
                :model-value="selectedIds.has(row.id)"
                :aria-label="t('users.selectUser', { name: row.name })"
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
            :aria-label="t('users.selectAllCurrent')"
            @update:model-value="(value) => toggleAll(value === true)"
          />
        </template>
        <template #cell-select="{ row }">
          <Checkbox
            :model-value="selectedIds.has(row.id)"
            :aria-label="t('users.selectUser', { name: row.name })"
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
              <span class="sr-only">{{
                t("users.editSrOnly", { name: row.name })
              }}</span>
            </Button>
            <RowActions
              :actions="
                buildUserActions(row).filter(
                  (item) => item.label !== t('users.actions.edit')
                )
              "
            />
          </div>
        </template>
      </DataList>
    </ListShell>

    <BulkActionsBar
      :count="selectedIds.size"
      :entity-name="t('users.entityName')"
      @clear="selectedIds = new Set()"
    >
      <Button
        v-if="auth.hasPermission('users.assign_role')"
        size="sm"
        @click="bulkRoleOpen = true"
      >
        {{ t("users.bulkRole.action") }}
      </Button>
    </BulkActionsBar>

    <FormDialog
      :open="bulkRoleOpen"
      :title="t('users.bulkRole.title')"
      :description="
        t('users.bulkRole.description', { count: selectedIds.size })
      "
      :submitting="bulkSubmitting"
      :submit-label="t('users.bulkRole.save')"
      @update:open="bulkRoleOpen = $event"
      @submit="handleBulkRoleSubmit"
    >
      <FieldGroup>
        <Field>
          <FieldLabel for="bulk-role">{{
            t("users.bulkRole.role")
          }}</FieldLabel>
          <Select v-model="bulkRoleId">
            <SelectTrigger
              id="bulk-role"
              class="w-full"
              :aria-label="t('users.bulkRole.role')"
            >
              <SelectValue :placeholder="t('users.bulkRole.selectRole')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="role in roles" :key="role.id" :value="role.id">
                {{ roleLabel(role) }}
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
    </FormDialog>

    <FormDialog
      :open="editOpen"
      :title="
        editingUser ? t('users.edit.editTitle') : t('users.edit.addTitle')
      "
      :description="
        editingUser
          ? t('users.edit.editDescription')
          : t('users.edit.addDescription')
      "
      :submitting="editSubmitting"
      :submit-label="
        editingUser ? t('users.edit.save') : t('users.edit.create')
      "
      @update:open="editOpen = $event"
      @submit="handleEditSubmit"
    >
      <FieldGroup>
        <Field>
          <FieldLabel for="username">{{ t("users.edit.username") }}</FieldLabel>
          <Input
            id="username"
            v-model="editForm.username"
            name="username"
            autocomplete="off"
            :spellcheck="false"
            :placeholder="t('users.edit.usernamePlaceholder')"
            required
          />
        </Field>
        <Field>
          <FieldLabel for="name">{{ t("users.edit.name") }}</FieldLabel>
          <Input
            id="name"
            v-model="editForm.name"
            name="name"
            autocomplete="off"
            :placeholder="t('users.edit.namePlaceholder')"
            required
          />
        </Field>
        <Field>
          <FieldLabel for="email">{{ t("users.edit.email") }}</FieldLabel>
          <Input
            id="email"
            v-model="editForm.email"
            name="email"
            autocomplete="off"
            :spellcheck="false"
            type="email"
            :placeholder="t('users.edit.emailPlaceholder')"
            required
          />
        </Field>
        <Field v-if="auth.hasPermission('users.assign_role')">
          <FieldLabel>{{ t("users.edit.role") }}</FieldLabel>
          <Select v-model="editForm.roleId">
            <SelectTrigger class="w-full" :aria-label="t('users.edit.role')">
              <SelectValue :placeholder="t('users.edit.selectRole')" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="role in roles"
                  :key="role.id"
                  :value="role.id"
                >
                  {{ roleLabel(role) }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
    </FormDialog>

    <FormDialog
      :open="roleOpen"
      :title="t('users.role.title')"
      :submitting="roleSubmitting"
      :submit-label="t('users.role.confirm')"
      @update:open="roleOpen = $event"
      @submit="handleRoleSubmit"
    >
      <template #description>
        {{ t("users.role.description", { name: roleTarget?.name ?? "" }) }}
      </template>
      <FieldGroup>
        <Field>
          <FieldLabel>{{ t("users.role.current") }}</FieldLabel>
          <div>
            <RoleBadge
              v-if="roleTarget"
              :role-id="roleTarget.roleId"
              :roles="roles"
            />
          </div>
        </Field>
        <Field>
          <FieldLabel>{{ t("users.role.new") }}</FieldLabel>
          <Select v-model="roleValue">
            <SelectTrigger class="w-full" :aria-label="t('users.role.new')">
              <SelectValue :placeholder="t('users.role.selectRole')" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="role in roles"
                  :key="role.id"
                  :value="role.id"
                >
                  {{ roleLabel(role) }}
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
          <DialogTitle>{{ t("users.reset.title") }}</DialogTitle>
          <DialogDescription>
            {{
              t("users.reset.description", { name: resetTarget?.name ?? "" })
            }}
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel>{{ t("users.reset.newPassword") }}</FieldLabel>
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
                :aria-label="t('users.reset.regenerate')"
                @click="newPassword = generatePassword()"
              >
                <RefreshCw />
              </Button>
              <Button variant="outline" @click="copyPassword">{{
                t("users.reset.copy")
              }}</Button>
            </div>
            <p class="text-sm text-muted-foreground">
              {{ t("users.reset.hint") }}
            </p>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <LoadingButton :loading="resetSubmitting" @click="handleResetSubmit">
            {{ t("users.reset.confirm") }}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog :open="pendingOpen" @update:open="pendingOpen = $event">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ t("users.pending.title") }}</DialogTitle>
          <DialogDescription>
            {{
              t("users.pending.description", {
                total: pendingUsers.length,
                selected: selectedPending.size,
              })
            }}
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
            title: t('users.pending.emptyTitle'),
            description: t('users.pending.emptyDescription'),
          }"
          @retry="openPending"
        >
          <template #head-select>
            <Checkbox
              :model-value="pendingCheckboxState"
              :aria-label="t('users.selectAllPending')"
              @update:model-value="toggleAllPending"
            />
          </template>
          <template #cell-select="{ row }">
            <Checkbox
              :model-value="selectedPending.has(row.id)"
              :aria-label="t('users.selectUser', { name: row.name })"
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
                  :aria-label="t('users.selectUser', { name: row.name })"
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
            {{ t("users.pending.reject", { count: selectedPending.size }) }}
          </Button>
          <LoadingButton
            :disabled="selectedPending.size === 0"
            :loading="pendingSubmitting"
            @click="handleBatchApprove"
          >
            {{ t("users.pending.approve", { count: selectedPending.size }) }}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDeleteDialog
      :open="rejectOpen"
      :target-name="
        t('users.pending.rejectTarget', { count: selectedPending.size })
      "
      :description="t('users.pending.rejectDescription')"
      :loading="pendingSubmitting"
      @update:open="rejectOpen = $event"
      @confirm="handleBatchReject"
    />
  </div>
</template>
