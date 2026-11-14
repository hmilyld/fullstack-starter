import * as React from "react"
import { useTranslation } from "react-i18next"
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
import { DensityToggle } from "@/components/shared/density-toggle"
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
import { useTableDensity } from "@/hooks/use-table-density"
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
  const { t } = useTranslation()
  const roleLabel = (role: Role) =>
    t(`roles.${role.id}`, { defaultValue: role.name })
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
    else
      setPermissionsError(
        menuRes.message || t("rolePermissions.loadMenuFailed")
      )
    if (opRes.code === 0) setOperationPermissions(opRes.data)
    else
      setPermissionsError(
        opRes.message || t("rolePermissions.loadOperationFailed")
      )
    setPermissionsLoading(false)
  }, [t])

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
      appToast.error(res.message || t("rolesPage.toasts.operationFailed"))
      return
    }
    appToast.success(
      editingRole
        ? t("rolesPage.toasts.saveSuccess")
        : t("rolesPage.toasts.createSuccess")
    )
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
      appToast.error(res.message || t("rolesPage.toasts.deleteFailed"))
      return
    }
    appToast.success(t("rolesPage.toasts.deleteSuccess"))
    setDeleteOpen(false)
    list.refresh()
  }

  function buildRoleActions(role: Role): RowAction[] {
    const actions: RowAction[] = []
    if (hasPermission("roles.edit")) {
      actions.push({
        label: t("rolesPage.actions.edit"),
        icon: PencilIcon,
        onSelect: () => handleEdit(role),
      })
    }
    if (!role.isPreset && hasPermission("roles.delete")) {
      actions.push({
        label: t("rolesPage.actions.delete"),
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
      header: t("rolesPage.headers.name"),
      cell: (role) => <span className="font-medium">{role.name}</span>,
    },
    {
      key: "description",
      header: t("rolesPage.headers.description"),
      hideable: true,
      headClassName: "hidden md:table-cell",
      cellClassName: "hidden text-muted-foreground md:table-cell",
      cell: (role) => role.description || "-",
    },
    {
      key: "permissions",
      header: t("rolesPage.headers.permissionCount"),
      hideable: true,
      headClassName: "hidden lg:table-cell",
      cellClassName: "hidden lg:table-cell",
      cell: (role) => (
        <Badge variant="secondary">{role.permissions.length}</Badge>
      ),
    },
    {
      key: "type",
      header: t("rolesPage.headers.type"),
      cell: (role) =>
        role.isPreset ? (
          <Badge variant="outline">
            <LockIcon />
            {t("rolesPage.preset")}
          </Badge>
        ) : (
          <Badge variant="secondary">{t("rolesPage.custom")}</Badge>
        ),
    },
    {
      key: "actions",
      header: t("rolesPage.headers.actions"),
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
              <span className="sr-only">
                {t("rolesPage.editSrOnly", { name: role.name })}
              </span>
            </Button>
          )}
          <RowActions
            actions={buildRoleActions(role).filter(
              (action) => action.label !== t("rolesPage.actions.edit")
            )}
          />
        </div>
      ),
    },
  ]

  const table = useColumnVisibility("roles", columns)
  const { density, setDensity } = useTableDensity("roles")

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <PageHeader
        title={t("rolesPage.title")}
        description={t("rolesPage.description")}
      />

      <ListShell
        description={t("rolesPage.listDescription", { total: list.total })}
        actions={
          <>
            <InputGroup className="w-full md:w-64">
              <InputGroupInput
                name="q"
                autoComplete="off"
                spellCheck={false}
                placeholder={t("rolesPage.searchPlaceholder")}
                aria-label={t("rolesPage.searchAria")}
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
            <DensityToggle density={density} onChange={setDensity} />
            {hasPermission("roles.create") && (
              <Button onClick={handleAdd} className="w-full md:w-auto">
                <PlusIcon data-icon="inline-start" />
                {t("rolesPage.addRole")}
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
              itemLabel={t("rolesPage.entityName")}
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
            title: debouncedSearch
              ? t("rolesPage.emptySearchTitle")
              : t("rolesPage.emptyTitle"),
            description: debouncedSearch
              ? t("rolesPage.emptySearchDescription")
              : t("rolesPage.emptyDescription"),
            action: debouncedSearch ? (
              <Button variant="outline" onClick={() => setSearch("")}>
                {t("rolesPage.clearSearch")}
              </Button>
            ) : hasPermission("roles.create") ? (
              <Button onClick={handleAdd}>
                <PlusIcon data-icon="inline-start" />
                {t("rolesPage.addRole")}
              </Button>
            ) : null,
          }}
          renderCard={(role) => (
            <RecordCard
              key={role.id}
              title={roleLabel(role)}
              badges={
                <>
                  {role.isPreset ? (
                    <Badge variant="outline">{t("rolesPage.preset")}</Badge>
                  ) : (
                    <Badge variant="secondary">{t("rolesPage.custom")}</Badge>
                  )}
                  <Badge variant="secondary">
                    {t("rolesPage.permissionCount", {
                      count: role.permissions.length,
                    })}
                  </Badge>
                </>
              }
              subtitle={role.description || t("rolesPage.noDescription")}
              actions={<RowActions actions={buildRoleActions(role)} />}
            />
          )}
          columns={table.visibleColumns}
          density={density}
        />
      </ListShell>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title={
          editingRole
            ? t("rolesPage.edit.editTitle")
            : t("rolesPage.edit.addTitle")
        }
        description={
          editingRole
            ? t("rolesPage.edit.editDescription")
            : t("rolesPage.edit.addDescription")
        }
        submitting={editSubmitting}
        className="sm:w-[calc(100%_-_2rem)] sm:max-w-4xl"
        onSubmit={handleEditSubmit}
      >
        <FieldGroup>
          <div className="@md/field-group:grid @md/field-group:grid-cols-2 @md/field-group:items-start @md/field-group:gap-4">
            <Field>
              <FieldLabel htmlFor="role-name">
                {t("rolesPage.edit.name")}
              </FieldLabel>
              <Input
                name="role-name"
                autoComplete="off"
                id="role-name"
                placeholder={t("rolesPage.edit.namePlaceholder")}
                value={editForm.name}
                onChange={(event) =>
                  setEditForm((form) => ({ ...form, name: event.target.value }))
                }
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="role-desc">
                {t("rolesPage.edit.description")}
              </FieldLabel>
              <Input
                name="role-desc"
                autoComplete="off"
                id="role-desc"
                placeholder={t("rolesPage.edit.descriptionPlaceholder")}
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
            {t("rolesPage.edit.permissions")}
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
        description={t("rolesPage.deleteDescription")}
        onConfirm={handleDeleteConfirm}
        loading={deleteSubmitting}
      />
    </div>
  )
}
