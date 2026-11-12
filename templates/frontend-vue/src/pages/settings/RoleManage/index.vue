<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { Lock, Pencil, Plus, Search, ShieldCheck, Trash2 } from "@lucide/vue"
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog.vue"
import ColumnToggle from "@/components/shared/ColumnToggle.vue"
import DensityToggle from "@/components/shared/DensityToggle.vue"
import DataList, { type DataColumn } from "@/components/shared/DataList.vue"
import FormDialog from "@/components/shared/FormDialog.vue"
import ListShell from "@/components/shared/ListShell.vue"
import PageHeader from "@/components/shared/PageHeader.vue"
import RecordCard from "@/components/shared/RecordCard.vue"
import RowActions from "@/components/shared/RowActions.vue"
import type { RowAction } from "@/components/shared/row-action"
import TablePagination from "@/components/shared/TablePagination.vue"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Field,
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
import { getPermissions } from "@/api/permission"
import {
  createRole,
  deleteRole as apiDeleteRole,
  getRoles,
  updateRole,
} from "@/api/role"
import { useDebouncedValue } from "@/composables/use-debounced-value"
import { useColumnVisibility } from "@/composables/use-column-visibility"
import { useTableDensity } from "@/composables/use-table-density"
import { usePagedList } from "@/composables/use-paged-list"
import { useUrlListState } from "@/composables/use-url-list-state"
import { useAuthStore } from "@/stores/auth"
import { useToast } from "@/composables/use-toast"
import RolePermissionPicker from "@/pages/settings/RoleManage/RolePermissionPicker.vue"
import type { Permission } from "@/types/permission"
import type { Role } from "@/types/role"

const DEFAULT_PAGE_SIZE = 8
const PAGE_SIZE_OPTIONS = [8, 16, 32]

const auth = useAuthStore()
const toast = useToast()

const pageSize = ref(DEFAULT_PAGE_SIZE)
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
  pageSize,
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

const columns: DataColumn[] = [
  { key: "name", header: "角色名称" },
  {
    key: "description",
    header: "描述",
    hideable: true,
    headClass: "hidden md:table-cell",
    cellClass: "hidden text-muted-foreground md:table-cell",
  },
  {
    key: "permissions",
    header: "权限数",
    hideable: true,
    headClass: "hidden lg:table-cell",
    cellClass: "hidden lg:table-cell",
  },
  { key: "type", header: "类型" },
  {
    key: "actions",
    header: "操作",
    pinRight: true,
    headClass: "text-right",
    cellClass: "text-right",
  },
]

const { hidden, visibleColumns, toggle, reset } = useColumnVisibility(
  "roles",
  columns
)
const { density, setDensity } = useTableDensity("roles")

const hasRoles = computed(() => roles.value.length > 0)
</script>

<template>
  <div class="flex flex-col gap-(--page-gap)">
    <PageHeader title="角色管理" description="管理系统角色及其权限分配。" />

    <ListShell :description="`共 ${total} 个角色`">
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
        <ColumnToggle
          :columns="columns"
          :hidden="hidden"
          @toggle="toggle"
          @reset="reset"
        />
        <DensityToggle :density="density" @change="setDensity" />
        <Button
          v-if="auth.hasPermission('roles.create')"
          class="w-full md:w-auto"
          @click="handleAdd"
        >
          <Plus data-icon="inline-start" />
          新增角色
        </Button>
      </template>

      <template v-if="hasRoles" #footer>
        <TablePagination
          :page="currentPage"
          :total-pages="totalPages"
          :total="total"
          item-label="个角色"
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
        :items="roles"
        :loading="listLoading"
        :error="listError"
        :columns="visibleColumns"
        :density="density"
        :skeleton-col-span="5"
        :empty="{
          icon: ShieldCheck,
          title: debouncedSearch ? '没有匹配的角色' : '还没有角色',
          description: debouncedSearch
            ? '换个关键词，或清空搜索条件后再试。'
            : '创建角色并分配权限，再把角色授予用户。',
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
            v-else-if="auth.hasPermission('roles.create')"
            @click="handleAdd"
          >
            <Plus data-icon="inline-start" />
            新增角色
          </Button>
        </template>

        <template #card="{ row }">
          <RecordCard
            :title="row.name"
            :subtitle="row.description || '暂无描述'"
          >
            <template #badges>
              <Badge v-if="row.isPreset" variant="outline">预设</Badge>
              <Badge v-else variant="secondary">自定义</Badge>
              <Badge variant="secondary"
                >{{ row.permissions.length }} 项权限</Badge
              >
            </template>
            <template #actions>
              <RowActions :actions="buildRoleActions(row)" />
            </template>
          </RecordCard>
        </template>

        <template #cell-name="{ row }">
          <span class="font-medium">{{ row.name }}</span>
        </template>
        <template #cell-description="{ row }">
          {{ row.description || "-" }}
        </template>
        <template #cell-permissions="{ row }">
          <Badge variant="secondary">{{ row.permissions.length }}</Badge>
        </template>
        <template #cell-type="{ row }">
          <Badge v-if="row.isPreset" variant="outline">
            <Lock />
            预设
          </Badge>
          <Badge v-else variant="secondary">自定义</Badge>
        </template>
        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <Button
              v-if="auth.hasPermission('roles.edit')"
              variant="ghost"
              size="icon-sm"
              @click="handleEdit(row)"
            >
              <Pencil />
              <span class="sr-only">编辑 {{ row.name }}</span>
            </Button>
            <RowActions
              :actions="
                buildRoleActions(row).filter((item) => item.label !== '编辑')
              "
            />
          </div>
        </template>
      </DataList>
    </ListShell>

    <FormDialog
      :open="editOpen"
      :title="editingRole ? '编辑角色' : '新增角色'"
      :description="
        editingRole ? '修改角色信息和权限分配。' : '填写角色信息并分配权限。'
      "
      :submitting="editSubmitting"
      class="sm:w-[calc(100%_-_2rem)] sm:max-w-4xl"
      @update:open="editOpen = $event"
      @submit="handleEditSubmit"
    >
      <FieldGroup>
        <div
          class="@md/field-group:grid @md/field-group:grid-cols-2 @md/field-group:items-start @md/field-group:gap-4"
        >
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
        </div>
      </FieldGroup>

      <FieldSet class="mt-6 gap-3">
        <FieldLegend variant="label" class="mb-0">权限分配</FieldLegend>
        <RolePermissionPicker
          v-model="editPermissions"
          :menu-permissions="menuPermissions"
          :operation-permissions="operationPermissions"
          :loading="permissionsLoading"
          :error="permissionsError"
          @retry="loadPermissions"
        />
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
