import * as React from "react"
import { useTranslation } from "react-i18next"
import {
  KeyIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldIcon,
  Trash2Icon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react"

import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog"
import { BulkActionsBar } from "@/components/shared/bulk-actions-bar"
import { ColumnToggle } from "@/components/shared/column-toggle"
import { DensityToggle } from "@/components/shared/density-toggle"
import { DataList, type DataColumn } from "@/components/shared/data-list"
import { FormDialog } from "@/components/shared/form-dialog"
import { ListShell } from "@/components/shared/list-shell"
import { LoadingButton } from "@/components/shared/loading-button"
import { PageHeader } from "@/components/shared/page-header"
import { RecordCard } from "@/components/shared/record-card"
import { RoleBadge } from "@/components/shared/role-badge"
import { RowActions, type RowAction } from "@/components/shared/row-actions"
import { TablePagination } from "@/components/shared/table-pagination"
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
import { useColumnVisibility } from "@/hooks/use-column-visibility"
import { useTableDensity } from "@/hooks/use-table-density"
import { usePagedList } from "@/hooks/use-paged-list"
import { useUrlListState } from "@/hooks/use-url-list-state"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useAuth } from "@/lib/auth-context"
import { appToast } from "@/lib/toast"
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

export function UsersPage() {
  const { t } = useTranslation()
  const { hasPermission, user: currentUser } = useAuth()
  const [roles, setRoles] = React.useState<Role[]>([])
  const roleLabel = (role: Role) =>
    t(`roles.${role.id}`, { defaultValue: role.name })

  const { search, page, setSearch, setPage } = useUrlListState()
  const debouncedSearch = useDebouncedValue(search)
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE)
  const list = usePagedList<User, { search: string }>({
    fetcher: getUsers,
    params: { search: debouncedSearch },
    pageSize,
    page,
    onPageChange: setPage,
  })

  React.useEffect(() => {
    let cancelled = false
    getRoles({ pageSize: 100 }).then((res) => {
      if (!cancelled && res.code === 0) setRoles(res.data.list)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // 新增/编辑对话框
  const [editOpen, setEditOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<User | null>(null)
  const [editForm, setEditForm] = React.useState({
    username: "",
    name: "",
    email: "",
    roleId: "user",
  })
  const [editSubmitting, setEditSubmitting] = React.useState(false)

  // 角色维护对话框
  const [roleOpen, setRoleOpen] = React.useState(false)
  const [roleTarget, setRoleTarget] = React.useState<User | null>(null)
  const [roleValue, setRoleValue] = React.useState("")
  const [roleSubmitting, setRoleSubmitting] = React.useState(false)

  // 列表多选与批量操作
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [bulkRoleOpen, setBulkRoleOpen] = React.useState(false)
  const [bulkRoleId, setBulkRoleId] = React.useState("user")
  const [bulkSubmitting, setBulkSubmitting] = React.useState(false)

  // 删除确认对话框
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<User | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = React.useState(false)

  // 待审核对话框
  const [pendingOpen, setPendingOpen] = React.useState(false)
  const [pendingUsers, setPendingUsers] = React.useState<User[]>([])
  const [selectedPending, setSelectedPending] = React.useState<Set<string>>(
    new Set()
  )
  const [pendingLoading, setPendingLoading] = React.useState(false)
  const [pendingSubmitting, setPendingSubmitting] = React.useState(false)
  const [rejectOpen, setRejectOpen] = React.useState(false)

  // 重置密码对话框
  const [resetOpen, setResetOpen] = React.useState(false)
  const [resetTarget, setResetTarget] = React.useState<User | null>(null)
  const [newPassword, setNewPassword] = React.useState("")
  const [resetSubmitting, setResetSubmitting] = React.useState(false)

  function handleAdd() {
    setEditingUser(null)
    setEditForm({ username: "", name: "", email: "", roleId: "user" })
    setEditOpen(true)
  }

  function handleEdit(user: User) {
    setEditingUser(user)
    setEditForm({
      username: user.username,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
    })
    setEditOpen(true)
  }

  async function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEditSubmitting(true)
    const payload = {
      username: editForm.username,
      name: editForm.name,
      email: editForm.email,
      roleId: editForm.roleId,
    }
    const res = editingUser
      ? await updateUser(editingUser.id, payload)
      : await createUser(payload)
    setEditSubmitting(false)
    if (res.code !== 0) {
      appToast.error(res.message || t("users.toasts.operationFailed"))
      return
    }
    appToast.success(
      editingUser
        ? t("users.toasts.saveSuccess")
        : t("users.toasts.createSuccess")
    )
    setEditOpen(false)
    list.refresh()
  }

  function handleRole(user: User) {
    setRoleTarget(user)
    setRoleValue(user.roleId)
    setRoleOpen(true)
  }

  async function handleRoleSubmit() {
    if (!roleTarget) return
    setRoleSubmitting(true)
    const res = await updateUser(roleTarget.id, { roleId: roleValue })
    setRoleSubmitting(false)
    if (res.code !== 0) {
      appToast.error(res.message || t("users.toasts.operationFailed"))
      return
    }
    appToast.success(t("users.toasts.roleUpdated"))
    setRoleOpen(false)
    list.refresh()
  }

  const pageIds = list.items.map((user) => user.id)
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))
  const someSelected = !allSelected && pageIds.some((id) => selectedIds.has(id))

  React.useEffect(() => {
    setSelectedIds(new Set())
  }, [list.page, debouncedSearch])

  function toggleSelected(id: string) {
    setSelectedIds((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(pageIds) : new Set())
  }

  async function handleBulkRoleSubmit() {
    if (selectedIds.size === 0) return
    setBulkSubmitting(true)
    const res = await batchUpdateRole(
      Array.from(selectedIds, Number),
      bulkRoleId
    )
    setBulkSubmitting(false)
    if (res.code !== 0) {
      appToast.error(res.message || t("users.toasts.bulkFailed"))
      return
    }
    appToast.success(
      t("users.toasts.bulkRoleSuccess", { count: selectedIds.size })
    )
    setBulkRoleOpen(false)
    setSelectedIds(new Set())
    list.refresh()
  }

  function handleDelete(user: User) {
    setDeleteTarget(user)
    setDeleteOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleteSubmitting(true)
    const res = await apiDeleteUser(deleteTarget.id)
    setDeleteSubmitting(false)
    if (res.code !== 0) {
      appToast.error(res.message || t("users.toasts.deleteFailed"))
      return
    }
    appToast.success(t("users.toasts.deleteSuccess"))
    setDeleteOpen(false)
    list.refresh()
  }

  async function openPending() {
    setPendingOpen(true)
    setPendingLoading(true)
    setSelectedPending(new Set())
    const res = await getUsers({ pageSize: 100 })
    if (res.code === 0) {
      setPendingUsers(
        res.data.list.filter((user) => user.roleId === "pending_review")
      )
    } else {
      appToast.error(res.message || t("users.toasts.pendingLoadFailed"))
    }
    setPendingLoading(false)
  }

  function togglePending(id: string) {
    setSelectedPending((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllPending() {
    if (selectedPending.size === pendingUsers.length) {
      setSelectedPending(new Set())
    } else {
      setSelectedPending(new Set(pendingUsers.map((user) => user.id)))
    }
  }

  async function handleBatchApprove() {
    if (selectedPending.size === 0) return
    setPendingSubmitting(true)
    const res = await batchUpdateRole(
      Array.from(selectedPending, Number),
      "user"
    )
    setPendingSubmitting(false)
    if (res.code !== 0) {
      appToast.error(res.message || t("users.toasts.reviewFailed"))
      return
    }
    appToast.success(
      t("users.toasts.approveSuccess", { count: selectedPending.size })
    )
    setPendingOpen(false)
    list.refresh()
  }

  async function handleBatchReject() {
    if (selectedPending.size === 0) return
    setPendingSubmitting(true)
    const results = await Promise.all(
      Array.from(selectedPending).map((id) => apiDeleteUser(id))
    )
    setPendingSubmitting(false)
    setRejectOpen(false)

    const failed = results.filter((res) => res.code !== 0).length
    if (failed > 0) {
      appToast.error(t("users.toasts.rejectFailed", { count: failed }))
      await openPending()
      return
    }

    appToast.success(
      t("users.toasts.rejectSuccess", { count: selectedPending.size })
    )
    setPendingOpen(false)
    list.refresh()
  }

  function openReset(user: User) {
    setResetTarget(user)
    setNewPassword(generatePassword())
    setResetOpen(true)
  }

  async function handleResetSubmit() {
    if (!resetTarget) return
    setResetSubmitting(true)
    const res = await resetPassword(resetTarget.id, newPassword)
    setResetSubmitting(false)
    if (res.code !== 0) {
      appToast.error(res.message || t("users.toasts.resetFailed"))
      return
    }
    appToast.success(t("users.toasts.resetSuccess"))
    setResetOpen(false)
  }

  async function copyPassword() {
    await navigator.clipboard.writeText(newPassword)
    appToast.success(t("users.toasts.passwordCopied"))
  }

  function buildUserActions(user: User): RowAction[] {
    const actions: RowAction[] = []
    if (hasPermission("users.edit")) {
      actions.push({
        label: t("users.actions.edit"),
        icon: PencilIcon,
        onSelect: () => handleEdit(user),
      })
    }
    if (hasPermission("users.assign_role")) {
      actions.push({
        label: t("users.actions.role"),
        icon: ShieldIcon,
        onSelect: () => handleRole(user),
      })
    }
    if (hasPermission("users.edit")) {
      actions.push({
        label: t("users.actions.reset"),
        icon: KeyIcon,
        onSelect: () => openReset(user),
      })
    }
    if (hasPermission("users.delete") && user.id !== currentUser?.id) {
      actions.push({
        label: t("users.actions.delete"),
        icon: Trash2Icon,
        destructive: true,
        separatorBefore: true,
        onSelect: () => handleDelete(user),
      })
    }
    return actions
  }

  const allPendingSelected =
    pendingUsers.length > 0 && selectedPending.size === pendingUsers.length
  const somePendingSelected = selectedPending.size > 0 && !allPendingSelected

  const columns: DataColumn<User>[] = [
    {
      key: "select",
      header: (
        <Checkbox
          checked={allSelected ? true : someSelected ? "indeterminate" : false}
          onCheckedChange={(checked) => toggleAll(checked === true)}
          aria-label={t("users.selectAllCurrent")}
        />
      ),
      headClassName: "w-10",
      cell: (user) => (
        <Checkbox
          checked={selectedIds.has(user.id)}
          onCheckedChange={() => toggleSelected(user.id)}
          aria-label={t("users.selectUser", { name: user.name })}
        />
      ),
    },
    {
      key: "username",
      header: t("users.headers.username"),
      cell: (user) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage
              src={user.avatar}
              alt={user.name}
              width={32}
              height={32}
            />
            <AvatarFallback>{user.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{user.username}</span>
        </div>
      ),
    },
    {
      key: "name",
      header: t("users.headers.name"),
      hideable: true,
      headClassName: "hidden md:table-cell",
      cellClassName: "hidden md:table-cell",
      cell: (user) => user.name,
    },
    {
      key: "email",
      header: t("users.headers.email"),
      hideable: true,
      headClassName: "hidden lg:table-cell",
      cellClassName: "hidden text-muted-foreground lg:table-cell",
      cell: (user) => user.email,
    },
    {
      key: "role",
      header: t("users.headers.role"),
      cell: (user) => <RoleBadge roleId={user.roleId} roles={roles} />,
    },
    {
      key: "actions",
      header: t("users.headers.actions"),
      pinRight: true,
      headClassName: "text-right",
      cellClassName: "text-right",
      cell: (user) => (
        <div className="flex items-center justify-end gap-1">
          {hasPermission("users.edit") && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleEdit(user)}
            >
              <PencilIcon />
              <span className="sr-only">
                {t("users.editSrOnly", { name: user.name })}
              </span>
            </Button>
          )}
          <RowActions
            actions={buildUserActions(user).filter(
              (action) => action.label !== t("users.actions.edit")
            )}
          />
        </div>
      ),
    },
  ]

  const table = useColumnVisibility("users", columns)
  const { density, setDensity } = useTableDensity("users")

  const pendingColumns: DataColumn<User>[] = [
    {
      key: "select",
      header: (
        <Checkbox
          checked={
            allPendingSelected
              ? true
              : somePendingSelected
                ? "indeterminate"
                : false
          }
          onCheckedChange={toggleAllPending}
          aria-label={t("users.selectAllPending")}
        />
      ),
      headClassName: "w-12",
      cell: (user) => (
        <Checkbox
          checked={selectedPending.has(user.id)}
          onCheckedChange={() => togglePending(user.id)}
          aria-label={t("users.selectUser", { name: user.name })}
        />
      ),
    },
    {
      key: "username",
      header: t("users.headers.username"),
      cell: (user) => user.username,
    },
    { key: "name", header: t("users.headers.name"), cell: (user) => user.name },
    {
      key: "email",
      header: t("users.headers.email"),
      cell: (user) => user.email,
    },
  ]

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <PageHeader
        title={t("users.title")}
        description={t("users.description")}
      />

      <ListShell
        description={t("users.listDescription", { total: list.total })}
        actions={
          <>
            <InputGroup className="w-full md:w-64">
              <InputGroupInput
                name="q"
                autoComplete="off"
                spellCheck={false}
                placeholder={t("users.searchPlaceholder")}
                aria-label={t("users.searchAria")}
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
            {hasPermission("users.create") && (
              <Button onClick={handleAdd} className="w-full md:w-auto">
                <PlusIcon data-icon="inline-start" />
                {t("users.addUser")}
              </Button>
            )}
            {hasPermission("users.edit") && (
              <Button
                variant="outline"
                onClick={openPending}
                className="w-full md:w-auto"
              >
                {t("users.pendingReview")}
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
              itemLabel={t("users.entityName")}
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
          skeletonColSpan={6}
          getKey={(user) => user.id}
          onHideColumn={table.toggle}
          empty={{
            icon: UsersIcon,
            title: debouncedSearch
              ? t("users.emptySearchTitle")
              : t("users.emptyTitle"),
            description: debouncedSearch
              ? t("users.emptySearchDescription")
              : t("users.emptyDescription"),
            action: debouncedSearch ? (
              <Button variant="outline" onClick={() => setSearch("")}>
                {t("users.clearSearch")}
              </Button>
            ) : hasPermission("users.create") ? (
              <Button onClick={handleAdd}>
                <PlusIcon data-icon="inline-start" />
                {t("users.addUser")}
              </Button>
            ) : null,
          }}
          renderCard={(user) => (
            <RecordCard
              key={user.id}
              leading={
                <Checkbox
                  checked={selectedIds.has(user.id)}
                  onCheckedChange={() => toggleSelected(user.id)}
                  aria-label={t("users.selectUser", { name: user.name })}
                  className="mt-0.5"
                />
              }
              title={
                <span className="flex items-center gap-2">
                  <Avatar className="size-7">
                    <AvatarImage
                      src={user.avatar}
                      alt={user.name}
                      width={28}
                      height={28}
                    />
                    <AvatarFallback>{user.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{user.name}</span>
                </span>
              }
              badges={<RoleBadge roleId={user.roleId} roles={roles} />}
              subtitle={`@${user.username} · ${user.email}`}
              actions={<RowActions actions={buildUserActions(user)} />}
            />
          )}
          columns={table.visibleColumns}
          density={density}
        />
      </ListShell>

      <BulkActionsBar
        count={selectedIds.size}
        entityName={t("users.entityName")}
        onClear={() => setSelectedIds(new Set())}
      >
        {hasPermission("users.assign_role") && (
          <Button size="sm" onClick={() => setBulkRoleOpen(true)}>
            {t("users.bulkRole.action")}
          </Button>
        )}
      </BulkActionsBar>

      <FormDialog
        open={bulkRoleOpen}
        onOpenChange={setBulkRoleOpen}
        title={t("users.bulkRole.title")}
        description={t("users.bulkRole.description", {
          count: selectedIds.size,
        })}
        submitting={bulkSubmitting}
        submitLabel={t("users.bulkRole.save")}
        onSubmit={(event) => {
          event.preventDefault()
          void handleBulkRoleSubmit()
        }}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="bulk-role">
              {t("users.bulkRole.role")}
            </FieldLabel>
            <Select value={bulkRoleId} onValueChange={setBulkRoleId}>
              <SelectTrigger id="bulk-role" className="w-full">
                <SelectValue placeholder={t("users.bulkRole.selectRole")} />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {roleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      </FormDialog>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title={
          editingUser ? t("users.edit.editTitle") : t("users.edit.addTitle")
        }
        description={
          editingUser
            ? t("users.edit.editDescription")
            : t("users.edit.addDescription")
        }
        submitting={editSubmitting}
        submitLabel={
          editingUser ? t("users.edit.save") : t("users.edit.create")
        }
        onSubmit={handleEditSubmit}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="username">
              {t("users.edit.username")}
            </FieldLabel>
            <Input
              name="username"
              autoComplete="off"
              spellCheck={false}
              id="username"
              placeholder={t("users.edit.usernamePlaceholder")}
              value={editForm.username}
              onChange={(event) =>
                setEditForm((form) => ({
                  ...form,
                  username: event.target.value,
                }))
              }
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="name">{t("users.edit.name")}</FieldLabel>
            <Input
              name="name"
              autoComplete="off"
              id="name"
              placeholder={t("users.edit.namePlaceholder")}
              value={editForm.name}
              onChange={(event) =>
                setEditForm((form) => ({ ...form, name: event.target.value }))
              }
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">{t("users.edit.email")}</FieldLabel>
            <Input
              name="email"
              autoComplete="off"
              spellCheck={false}
              id="email"
              type="email"
              placeholder={t("users.edit.emailPlaceholder")}
              value={editForm.email}
              onChange={(event) =>
                setEditForm((form) => ({ ...form, email: event.target.value }))
              }
              required
            />
          </Field>
          {hasPermission("users.assign_role") && (
            <Field>
              <FieldLabel>{t("users.edit.role")}</FieldLabel>
              <Select
                value={editForm.roleId}
                onValueChange={(value) =>
                  setEditForm((form) => ({ ...form, roleId: value }))
                }
              >
                <SelectTrigger
                  className="w-full"
                  aria-label={t("users.edit.role")}
                >
                  <SelectValue placeholder={t("users.edit.selectRole")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {roleLabel(role)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}
        </FieldGroup>
      </FormDialog>

      <FormDialog
        open={roleOpen}
        onOpenChange={setRoleOpen}
        title={t("users.role.title")}
        description={t("users.role.description", {
          name: roleTarget?.name ?? "",
        })}
        submitting={roleSubmitting}
        submitLabel={t("users.role.confirm")}
        onSubmit={(event) => {
          event.preventDefault()
          void handleRoleSubmit()
        }}
      >
        <FieldGroup>
          <Field>
            <FieldLabel>{t("users.role.current")}</FieldLabel>
            <div>
              {roleTarget && (
                <RoleBadge roleId={roleTarget.roleId} roles={roles} />
              )}
            </div>
          </Field>
          <Field>
            <FieldLabel>{t("users.role.new")}</FieldLabel>
            <Select value={roleValue} onValueChange={setRoleValue}>
              <SelectTrigger
                className="w-full"
                aria-label={t("users.role.new")}
              >
                <SelectValue placeholder={t("users.role.selectRole")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {roleLabel(role)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      </FormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        targetName={deleteTarget?.name ?? ""}
        onConfirm={handleDeleteConfirm}
        loading={deleteSubmitting}
      />

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("users.reset.title")}</DialogTitle>
            <DialogDescription>
              {t("users.reset.description", { name: resetTarget?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>{t("users.reset.newPassword")}</FieldLabel>
              <div className="flex gap-2">
                <Input
                  name="newPassword"
                  autoComplete="off"
                  value={newPassword}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={t("users.reset.regenerate")}
                  onClick={() => setNewPassword(generatePassword())}
                >
                  <RefreshCwIcon />
                </Button>
                <Button variant="outline" onClick={copyPassword}>
                  {t("users.reset.copy")}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("users.reset.hint")}
              </p>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <LoadingButton
              onClick={handleResetSubmit}
              loading={resetSubmitting}
            >
              {t("users.reset.confirm")}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingOpen} onOpenChange={setPendingOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("users.pending.title")}</DialogTitle>
            <DialogDescription>
              {t("users.pending.description", {
                total: pendingUsers.length,
                selected: selectedPending.size,
              })}
            </DialogDescription>
          </DialogHeader>
          <DataList
            items={pendingUsers}
            loading={pendingLoading}
            error={null}
            onRetry={() => void openPending()}
            columns={pendingColumns}
            getKey={(user) => user.id}
            stickyHeader={false}
            bordered={false}
            skeletonColSpan={4}
            empty={{
              icon: UserRoundIcon,
              title: t("users.pending.emptyTitle"),
              description: t("users.pending.emptyDescription"),
            }}
            renderCard={(user) => (
              <RecordCard
                title={user.name}
                subtitle={`@${user.username} · ${user.email}`}
                leading={
                  <Checkbox
                    checked={selectedPending.has(user.id)}
                    onCheckedChange={() => togglePending(user.id)}
                    aria-label={t("users.selectUser", { name: user.name })}
                    className="mt-0.5"
                  />
                }
              />
            )}
          />
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              disabled={selectedPending.size === 0 || pendingSubmitting}
              onClick={() => setRejectOpen(true)}
            >
              {t("users.pending.reject", { count: selectedPending.size })}
            </Button>
            <LoadingButton
              disabled={selectedPending.size === 0}
              loading={pendingSubmitting}
              onClick={handleBatchApprove}
            >
              {t("users.pending.approve", { count: selectedPending.size })}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        targetName={t("users.pending.rejectTarget", {
          count: selectedPending.size,
        })}
        description={t("users.pending.rejectDescription")}
        onConfirm={handleBatchReject}
        loading={pendingSubmitting}
      />
    </div>
  )
}
