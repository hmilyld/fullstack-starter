<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { Lock, Pencil, Plus, Search, ShieldCheck, Trash2 } from "@lucide/vue"
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog.vue"
import EmptyState from "@/components/shared/EmptyState.vue"
import ErrorState from "@/components/shared/ErrorState.vue"
import FormDialog from "@/components/shared/FormDialog.vue"
import InlineError from "@/components/shared/InlineError.vue"
import ListShell from "@/components/shared/ListShell.vue"
import PageHeader from "@/components/shared/PageHeader.vue"
import RecordCard from "@/components/shared/RecordCard.vue"
import RowActions from "@/components/shared/RowActions.vue"
import type { RowAction } from "@/components/shared/row-action"
import TablePagination from "@/components/shared/TablePagination.vue"
import TableSkeletonRow from "@/components/shared/TableSkeletonRow.vue"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getPermissions } from "@/api/permission"
import {
  createRole,
  deleteRole as apiDeleteRole,
  getRoles,
  updateRole,
} from "@/api/role"
import { useDebouncedValue } from "@/composables/use-debounced-value"
import { usePagedList } from "@/composables/use-paged-list"
import { useUrlListState } from "@/composables/use-url-list-state"
import { useAuthStore } from "@/stores/auth"
import { useToast } from "@/composables/use-toast"
import type { Permission } from "@/types/permission"
import type { Role } from "@/types/role"

const PAGE_SIZE = 8

const auth = useAuthStore()
const toast = useToast()

const { search, page, setSearch, setPage } = useUrlListState()
const debouncedSearch = useDebouncedValue(search)

const {
  items: roles,
  total,
  page: currentPage,
  totalPages,
  loading: listLoading,
  error: listError,
  setPage: setListPage,
  refresh: refreshList,
} = usePagedList<Role, { search: string }>({
  fetcher: getRoles,
  params: computed(() => ({ search: debouncedSearch.value })),
  pageSize: PAGE_SIZE,
  page,
  onPageChange: setPage,
})

const menuPermissions = ref<Permission[]>([])
const operationPermissions = ref<Permission[]>([])
const permissionsLoading = ref(true)
const permissionsError = ref<string | null>(null)

async function loadPermissions() {
  permissionsLoading.value = true
  permissionsError.value = null
  const [menuRes, opRes] = await Promise.all([
    getPermissions({ type: "menu" }),
    getPermissions({ type: "operation" }),
  ])
  if (menuRes.code === 0) menuPermissions.value = menuRes.data
  else permissionsError.value = menuRes.message || "加载菜单权限失败"
  if (opRes.code === 0) operationPermissions.value = opRes.data
  else permissionsError.value = opRes.message || "加载操作权限失败"
  permissionsLoading.value = false
}

onMounted(() => {
  void loadPermissions()
})

const editOpen = ref(false)
const editingRole = ref<Role | null>(null)
const editForm = ref({ name: "", description: "" })
const editPermissions = ref<string[]>([])
const editSubmitting = ref(false)

const deleteOpen = ref(false)
const deleteTarget = ref<Role | null>(null)
const deleteSubmitting = ref(false)

function handleAdd() {
  editingRole.value = null
  editForm.value = { name: "", description: "" }
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
  const payload = {
    name: editForm.value.name,
    description: editForm.value.description,
    permissions: editPermissions.value,
  }
  const res = editingRole.value
    ? await updateRole(editingRole.value.id, payload)
    : await createRole(payload)
  editSubmitting.value = false
  if (res.code !== 0) {
    toast.error(res.message || "操作失败")
    return
  }
  toast.success(editingRole.value ? "保存成功" : "创建成功")
  editOpen.value = false
  refreshList()
}

function togglePermission(code: string) {
  editPermissions.value = editPermissions.value.includes(code)
    ? editPermissions.value.filter((item) => item !== code)
    : [...editPermissions.value, code]
}

function toggleMenuPermission(code: string) {
  const has = editPermissions.value.includes(code)
  if (has) {
    editPermissions.value = editPermissions.value.filter(
      (item) =>
        item !== code &&
        !operationPermissions.value.some(
          (operation) => operation.code === item && operation.parent === code
        )
    )
    return
  }
  const childOperations = operationPermissions.value
    .filter((operation) => operation.parent === code)
    .map((operation) => operation.code)
  editPermissions.value = [
    ...editPermissions.value,
    code,
    ...childOperations.filter((item) => !editPermissions.value.includes(item)),
  ]
}

function isMenuChecked(code: string) {
  return editPermissions.value.includes(code)
}

function isMenuIndeterminate(code: string) {
  const children = operationPermissions.value.filter(
    (operation) => operation.parent === code
  )
  if (children.length === 0) return false
  const checked = children.filter((operation) =>
    editPermissions.value.includes(operation.code)
  ).length
  return checked > 0
}

function menuCheckboxState(code: string) {
  if (isMenuChecked(code)) return true
  if (isMenuIndeterminate(code)) return "indeterminate"
  return false
}

function childPermissions(code: string) {
  return operationPermissions.value.filter(
    (operation) => operation.parent === code
  )
}

function selectAllPermissions() {
  editPermissions.value = [
    ...menuPermissions.value.map((permission) => permission.code),
    ...operationPermissions.value.map((permission) => permission.code),
  ]
}

function clearPermissions() {
  editPermissions.value = []
}

function handleDelete(role: Role) {
  deleteTarget.value = role
  deleteOpen.value = true
}

async function handleDeleteConfirm() {
  if (!deleteTarget.value) return
  deleteSubmitting.value = true
  const res = await apiDeleteRole(deleteTarget.value.id)
  deleteSubmitting.value = false
  if (res.code !== 0) {
    toast.error(res.message || "删除失败")
    return
  }
  toast.success("删除成功")
  deleteOpen.value = false
  refreshList()
}

function buildRoleActions(role: Role): RowAction[] {
  const actions: RowAction[] = []
  if (auth.hasPermission("roles.edit")) {
    actions.push({
      label: "编辑",
      icon: Pencil,
      onSelect: () => handleEdit(role),
    })
  }
  if (!role.isPreset && auth.hasPermission("roles.delete")) {
    actions.push({
      label: "删除",
      icon: Trash2,
      destructive: true,
      separatorBefore: true,
      onSelect: () => handleDelete(role),
    })
  }
  return actions
}

const hasRoles = computed(() => roles.value.length > 0)
const showEmpty = computed(() => !listLoading.value && !hasRoles.value)
</script>

<template>
  <div class="flex flex-col gap-(--page-gap)">
    <PageHeader title="角色管理" description="管理系统角色及其权限分配。" />

    <ListShell title="角色列表" :description="`共 ${total} 个角色`">
      <template #actions>
        <InputGroup class="w-full md:w-64">
          <InputGroupInput
            name="q"
            autocomplete="off"
            :spellcheck="false"
            placeholder="搜索角色名称…"
            aria-label="搜索角色"
            :model-value="search"
            @update:model-value="setSearch(String($event))"
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <Button
          v-if="auth.hasPermission('roles.create')"
          class="w-full md:w-auto"
          @click="handleAdd"
        >
          <Plus data-icon="inline-start" />
          新增角色
        </Button>
      </template>

      <template #footer>
        <TablePagination
          v-if="hasRoles"
          :page="currentPage"
          :total-pages="totalPages"
          :total="total"
          item-label="个角色"
          @page-change="setListPage"
        />
      </template>

      <InlineError
        v-if="listError && hasRoles"
        :message="listError"
        :on-retry="refreshList"
      />

      <TableSkeletonRow v-if="listLoading && !hasRoles" :col-span="5" />
      <ErrorState
        v-else-if="listError && !hasRoles"
        :message="listError"
        :on-retry="refreshList"
      />
      <EmptyState
        v-else-if="showEmpty"
        :icon="ShieldCheck"
        :title="debouncedSearch ? '没有匹配的角色' : '还没有角色'"
        :description="
          debouncedSearch
            ? '换个关键词，或清空搜索条件后再试。'
            : '创建角色并分配权限，再把角色授予用户。'
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
            v-else-if="auth.hasPermission('roles.create')"
            @click="handleAdd"
          >
            <Plus data-icon="inline-start" />
            新增角色
          </Button>
        </template>
      </EmptyState>

      <template v-else>
        <div class="flex flex-col gap-2 md:hidden">
          <RecordCard
            v-for="role in roles"
            :key="role.id"
            :title="role.name"
            :subtitle="role.description || '暂无描述'"
          >
            <template #badges>
              <Badge v-if="role.isPreset" variant="outline">预设</Badge>
              <Badge v-else variant="secondary">自定义</Badge>
              <Badge variant="secondary"
                >{{ role.permissions.length }} 项权限</Badge
              >
            </template>
            <template #actions>
              <RowActions :actions="buildRoleActions(role)" />
            </template>
          </RecordCard>
        </div>

        <div class="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>角色名称</TableHead>
                <TableHead class="hidden md:table-cell">描述</TableHead>
                <TableHead class="hidden lg:table-cell">权限数</TableHead>
                <TableHead>类型</TableHead>
                <TableHead class="sticky right-0 bg-card text-right">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="role in roles" :key="role.id">
                <TableCell class="font-medium">{{ role.name }}</TableCell>
                <TableCell class="hidden text-muted-foreground md:table-cell">
                  {{ role.description || "-" }}
                </TableCell>
                <TableCell class="hidden lg:table-cell">
                  <Badge variant="secondary">{{
                    role.permissions.length
                  }}</Badge>
                </TableCell>
                <TableCell>
                  <Badge v-if="role.isPreset" variant="outline">
                    <Lock />
                    预设
                  </Badge>
                  <Badge v-else variant="secondary">自定义</Badge>
                </TableCell>
                <TableCell class="sticky right-0 bg-inherit text-right">
                  <div class="flex items-center justify-end gap-1">
                    <Button
                      v-if="auth.hasPermission('roles.edit')"
                      variant="ghost"
                      size="icon-sm"
                      @click="handleEdit(role)"
                    >
                      <Pencil />
                      <span class="sr-only">编辑 {{ role.name }}</span>
                    </Button>
                    <Button
                      v-if="
                        !role.isPreset && auth.hasPermission('roles.delete')
                      "
                      variant="ghost"
                      size="icon-sm"
                      @click="handleDelete(role)"
                    >
                      <Trash2 />
                      <span class="sr-only">删除 {{ role.name }}</span>
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
      :title="editingRole ? '编辑角色' : '新增角色'"
      :description="
        editingRole ? '修改角色信息和权限分配。' : '填写角色信息并分配权限。'
      "
      :submitting="editSubmitting"
      class="sm:max-w-lg"
      @update:open="editOpen = $event"
      @submit="handleEditSubmit"
    >
      <FieldGroup>
        <Field>
          <FieldLabel for="role-name">角色名称</FieldLabel>
          <Input
            id="role-name"
            v-model="editForm.name"
            name="role-name"
            autocomplete="off"
            placeholder="请输入角色名称"
            required
          />
        </Field>
        <Field>
          <FieldLabel for="role-desc">描述</FieldLabel>
          <Input
            id="role-desc"
            v-model="editForm.description"
            name="role-desc"
            autocomplete="off"
            placeholder="请输入角色描述"
          />
        </Field>
      </FieldGroup>

      <FieldSet class="gap-3">
        <FieldLegend variant="label" class="mb-0">权限分配</FieldLegend>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <FieldDescription>
            勾选菜单权限时，会自动勾选该菜单下的所有操作权限。
          </FieldDescription>
          <div class="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              @click="selectAllPermissions"
            >
              全选
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              @click="clearPermissions"
            >
              清空
            </Button>
          </div>
        </div>

        <div
          v-if="permissionsLoading"
          class="py-6 text-center text-sm text-muted-foreground"
        >
          权限加载中…
        </div>
        <div
          v-else-if="permissionsError"
          class="flex flex-col items-start gap-2 rounded-md border p-3 text-sm"
        >
          <span class="text-destructive">{{ permissionsError }}</span>
          <Button
            type="button"
            variant="outline"
            size="xs"
            @click="loadPermissions"
          >
            重试
          </Button>
        </div>
        <div v-else class="h-[min(50vh,420px)] overflow-y-auto pr-3">
          <div class="flex flex-col gap-3">
            <div
              v-for="permission in menuPermissions"
              :key="permission.code"
              class="flex flex-col gap-2"
            >
              <label class="flex items-center gap-2 text-sm">
                <Checkbox
                  :model-value="menuCheckboxState(permission.code)"
                  @update:model-value="toggleMenuPermission(permission.code)"
                />
                {{ permission.name }}
              </label>
              <div
                v-if="
                  childPermissions(permission.code).length > 0 &&
                  (isMenuChecked(permission.code) ||
                    isMenuIndeterminate(permission.code))
                "
                class="ml-6 flex flex-wrap gap-x-4 gap-y-2"
              >
                <label
                  v-for="child in childPermissions(permission.code)"
                  :key="child.code"
                  class="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Checkbox
                    :model-value="editPermissions.includes(child.code)"
                    @update:model-value="togglePermission(child.code)"
                  />
                  {{ child.name }}
                </label>
              </div>
            </div>
            <p
              v-if="menuPermissions.length === 0"
              class="py-6 text-center text-sm text-muted-foreground"
            >
              暂无可分配的权限
            </p>
          </div>
        </div>
      </FieldSet>
    </FormDialog>

    <ConfirmDeleteDialog
      :open="deleteOpen"
      :target-name="deleteTarget?.name ?? ''"
      description="已分配该角色的用户将失去对应权限。"
      :loading="deleteSubmitting"
      @update:open="deleteOpen = $event"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>
