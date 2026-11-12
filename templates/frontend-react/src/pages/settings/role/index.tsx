import * as React from "react"
import {
  LockIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react"

import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog"
import { ColumnToggle } from "@/components/shared/column-toggle"
import { DataList, type DataColumn } from "@/components/shared/data-list"
import { FormDialog } from "@/components/shared/form-dialog"
import { ListShell } from "@/components/shared/list-shell"
import { PageHeader } from "@/components/shared/page-header"
import { RecordCard } from "@/components/shared/record-card"
import { RowActions, type RowAction } from "@/components/shared/row-actions"
import { TablePagination } from "@/components/shared/table-pagination"
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
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useColumnVisibility } from "@/hooks/use-column-visibility"
import { usePagedList } from "@/hooks/use-paged-list"
import { useUrlListState } from "@/hooks/use-url-list-state"
import { useAuth } from "@/lib/auth-context"
import { appToast } from "@/lib/toast"
import { RolePermissionPicker } from "@/pages/settings/role/RolePermissionPicker"
import type { Permission } from "@/types/permission"
import type { Role } from "@/types/role"

const DEFAULT_PAGE_SIZE = 8
const PAGE_SIZE_OPTIONS = [8, 16, 32]

export function RolesPage() {
  const { hasPermission } = useAuth()
  const { search, page, setSearch, setPage } = useUrlListState()
  const debouncedSearch = useDebouncedValue(search)
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE)
  const list = usePagedList<Role, { search: string }>({
    fetcher: getRoles,
    params: { search: debouncedSearch },
    pageSize,
    page,
    onPageChange: setPage,
  })

  const [menuPermissions, setMenuPermissions] = React.useState<Permission[]>([])
  const [operationPermissions, setOperationPermissions] = React.useState<
    Permission[]
  >([])
  const [permissionsLoading, setPermissionsLoading] = React.useState(true)
  const [permissionsError, setPermissionsError] = React.useState<string | null>(
    null
  )

  const loadPermissions = React.useCallback(async () => {
    setPermissionsLoading(true)
    setPermissionsError(null)
    const [menuRes, opRes] = await Promise.all([
      getPermissions({ type: "menu" }),
      getPermissions({ type: "operation" }),
    ])
    if (menuRes.code === 0) setMenuPermissions(menuRes.data)
    else setPermissionsError(menuRes.message || "加载菜单权限失败")
    if (opRes.code === 0) setOperationPermissions(opRes.data)
    else setPermissionsError(opRes.message || "加载操作权限失败")
    setPermissionsLoading(false)
  }, [])

  React.useEffect(() => {
    void loadPermissions()
  }, [loadPermissions])

  // 新增/编辑对话框
  const [editOpen, setEditOpen] = React.useState(false)
  const [editingRole, setEditingRole] = React.useState<Role | null>(null)
  const [editForm, setEditForm] = React.useState({ name: "", description: "" })
  const [editPermissions, setEditPermissions] = React.useState<string[]>([])
  const [editSubmitting, setEditSubmitting] = React.useState(false)

  // 删除确认对话框
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Role | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = React.useState(false)

  function handleAdd() {
    setEditingRole(null)
    setEditForm({ name: "", description: "" })
    setEditPermissions([])
    setEditOpen(true)
  }

  function handleEdit(role: Role) {
    setEditingRole(role)
    setEditForm({ name: role.name, description: role.description })
    setEditPermissions([...role.permissions])
    setEditOpen(true)
  }

  async function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEditSubmitting(true)
    const payload = {
      name: editForm.name,
      description: editForm.description,
      permissions: editPermissions,
    }
    const res = editingRole
      ? await updateRole(editingRole.id, payload)
      : await createRole(payload)
    setEditSubmitting(false)
    if (res.code !== 0) {
      appToast.error(res.message || "操作失败")
      return
    }
    appToast.success(editingRole ? "保存成功" : "创建成功")
    setEditOpen(false)
    list.refresh()
  }

  function handleDelete(role: Role) {
    setDeleteTarget(role)
    setDeleteOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleteSubmitting(true)
    const res = await apiDeleteRole(deleteTarget.id)
    setDeleteSubmitting(false)
    if (res.code !== 0) {
      appToast.error(res.message || "删除失败")
      return
    }
    appToast.success("删除成功")
    setDeleteOpen(false)
    list.refresh()
  }

  function buildRoleActions(role: Role): RowAction[] {
    const actions: RowAction[] = []
    if (hasPermission("roles.edit")) {
      actions.push({
        label: "编辑",
        icon: PencilIcon,
        onSelect: () => handleEdit(role),
      })
    }
    if (!role.isPreset && hasPermission("roles.delete")) {
      actions.push({
        label: "删除",
        icon: Trash2Icon,
        destructive: true,
        separatorBefore: true,
        onSelect: () => handleDelete(role),
      })
    }
    return actions
  }

  const columns: DataColumn<Role>[] = [
    {
      key: "name",
      header: "角色名称",
      cell: (role) => <span className="font-medium">{role.name}</span>,
    },
    {
      key: "description",
      header: "描述",
      hideable: true,
      headClassName: "hidden md:table-cell",
      cellClassName: "hidden text-muted-foreground md:table-cell",
      cell: (role) => role.description || "-",
    },
    {
      key: "permissions",
      header: "权限数",
      hideable: true,
      headClassName: "hidden lg:table-cell",
      cellClassName: "hidden lg:table-cell",
      cell: (role) => (
        <Badge variant="secondary">{role.permissions.length}</Badge>
      ),
    },
    {
      key: "type",
      header: "类型",
      cell: (role) =>
        role.isPreset ? (
          <Badge variant="outline">
            <LockIcon />
            预设
          </Badge>
        ) : (
          <Badge variant="secondary">自定义</Badge>
        ),
    },
    {
      key: "actions",
      header: "操作",
      pinRight: true,
      headClassName: "text-right",
      cellClassName: "text-right",
      cell: (role) => (
        <div className="flex items-center justify-end gap-1">
          {hasPermission("roles.edit") && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleEdit(role)}
            >
              <PencilIcon />
              <span className="sr-only">编辑 {role.name}</span>
            </Button>
          )}
          {!role.isPreset && hasPermission("roles.delete") && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDelete(role)}
            >
              <Trash2Icon />
              <span className="sr-only">删除 {role.name}</span>
            </Button>
          )}
        </div>
      ),
    },
  ]

  const table = useColumnVisibility("roles", columns)

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <PageHeader title="角色管理" description="管理系统角色及其权限分配。" />

      <ListShell
        title="角色列表"
        description={`共 ${list.total} 个角色`}
        actions={
          <>
            <InputGroup className="w-full md:w-64">
              <InputGroupInput
                name="q"
                autoComplete="off"
                spellCheck={false}
                placeholder="搜索角色名称…"
                aria-label="搜索角色"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
            </InputGroup>
            <ColumnToggle
              columns={columns}
              hidden={table.hidden}
              onToggle={table.toggle}
              onReset={table.reset}
            />
            {hasPermission("roles.create") && (
              <Button onClick={handleAdd} className="w-full md:w-auto">
                <PlusIcon data-icon="inline-start" />
                新增角色
              </Button>
            )}
          </>
        }
        footer={
          list.items.length > 0 ? (
            <TablePagination
              page={list.page}
              totalPages={list.totalPages}
              total={list.total}
              itemLabel="个角色"
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(1)
              }}
              onPageChange={list.setPage}
            />
          ) : null
        }
      >
        <DataList
          items={list.items}
          loading={list.loading}
          error={list.error}
          onRetry={list.refresh}
          skeletonColSpan={5}
          getKey={(role) => role.id}
          onHideColumn={table.toggle}
          empty={{
            icon: ShieldCheckIcon,
            title: debouncedSearch ? "没有匹配的角色" : "还没有角色",
            description: debouncedSearch
              ? "换个关键词，或清空搜索条件后再试。"
              : "创建角色并分配权限，再把角色授予用户。",
            action: debouncedSearch ? (
              <Button variant="outline" onClick={() => setSearch("")}>
                清空搜索
              </Button>
            ) : hasPermission("roles.create") ? (
              <Button onClick={handleAdd}>
                <PlusIcon data-icon="inline-start" />
                新增角色
              </Button>
            ) : null,
          }}
          renderCard={(role) => (
            <RecordCard
              key={role.id}
              title={role.name}
              badges={
                <>
                  {role.isPreset ? (
                    <Badge variant="outline">预设</Badge>
                  ) : (
                    <Badge variant="secondary">自定义</Badge>
                  )}
                  <Badge variant="secondary">
                    {role.permissions.length} 项权限
                  </Badge>
                </>
              }
              subtitle={role.description || "暂无描述"}
              actions={<RowActions actions={buildRoleActions(role)} />}
            />
          )}
          columns={table.visibleColumns}
        />
      </ListShell>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title={editingRole ? "编辑角色" : "新增角色"}
        description={
          editingRole ? "修改角色信息和权限分配。" : "填写角色信息并分配权限。"
        }
        submitting={editSubmitting}
        className="sm:w-[calc(100%_-_2rem)] sm:max-w-4xl"
        onSubmit={handleEditSubmit}
      >
        <FieldGroup>
          <div className="@md/field-group:grid @md/field-group:grid-cols-2 @md/field-group:items-start @md/field-group:gap-4">
            <Field>
              <FieldLabel htmlFor="role-name">角色名称</FieldLabel>
              <Input
                name="role-name"
                autoComplete="off"
                id="role-name"
                placeholder="请输入角色名称"
                value={editForm.name}
                onChange={(event) =>
                  setEditForm((form) => ({ ...form, name: event.target.value }))
                }
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="role-desc">描述</FieldLabel>
              <Input
                name="role-desc"
                autoComplete="off"
                id="role-desc"
                placeholder="请输入角色描述"
                value={editForm.description}
                onChange={(event) =>
                  setEditForm((form) => ({
                    ...form,
                    description: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
        </FieldGroup>

        <FieldSet className="mt-6 gap-3">
          <FieldLegend variant="label" className="mb-0">
            权限分配
          </FieldLegend>
          <RolePermissionPicker
            menuPermissions={menuPermissions}
            operationPermissions={operationPermissions}
            value={editPermissions}
            onChange={setEditPermissions}
            loading={permissionsLoading}
            error={permissionsError}
            onRetry={loadPermissions}
          />
        </FieldSet>
      </FormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        targetName={deleteTarget?.name ?? ""}
        description="已分配该角色的用户将失去对应权限。"
        onConfirm={handleDeleteConfirm}
        loading={deleteSubmitting}
      />
    </div>
  )
}
