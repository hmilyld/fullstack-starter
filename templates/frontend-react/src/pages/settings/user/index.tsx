import * as React from "react"
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
import { DataList, type DataColumn } from "@/components/shared/data-list"
import { EmptyState } from "@/components/shared/empty-state"
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
import { useColumnVisibility } from "@/hooks/use-column-visibility"
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
  const { hasPermission, user: currentUser } = useAuth()
  const [roles, setRoles] = React.useState<Role[]>([])

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
      appToast.error(res.message || "操作失败")
      return
    }
    appToast.success(editingUser ? "保存成功" : "创建成功")
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
      appToast.error(res.message || "操作失败")
      return
    }
    appToast.success("角色已更新")
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
      appToast.error(res.message || "批量操作失败")
      return
    }
    appToast.success(`已更新 ${selectedIds.size} 位用户的角色`)
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
      appToast.error(res.message || "删除失败")
      return
    }
    appToast.success("删除成功")
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
      appToast.error(res.message || "加载待审核用户失败")
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
      appToast.error(res.message || "审核失败")
      return
    }
    appToast.success(`已通过 ${selectedPending.size} 位用户审核`)
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
      appToast.error(`${failed} 位用户拒绝失败`)
      await openPending()
      return
    }

    appToast.success(`已拒绝 ${selectedPending.size} 位用户`)
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
      appToast.error(res.message || "重置失败")
      return
    }
    appToast.success("密码已重置")
    setResetOpen(false)
  }

  async function copyPassword() {
    await navigator.clipboard.writeText(newPassword)
    appToast.success("密码已复制到剪贴板")
  }

  function buildUserActions(user: User): RowAction[] {
    const actions: RowAction[] = []
    if (hasPermission("users.edit")) {
      actions.push({
        label: "编辑",
        icon: PencilIcon,
        onSelect: () => handleEdit(user),
      })
    }
    if (hasPermission("users.assign_role")) {
      actions.push({
        label: "维护角色",
        icon: ShieldIcon,
        onSelect: () => handleRole(user),
      })
    }
    if (hasPermission("users.edit")) {
      actions.push({
        label: "重置密码",
        icon: KeyIcon,
        onSelect: () => openReset(user),
      })
    }
    if (hasPermission("users.delete") && user.id !== currentUser?.id) {
      actions.push({
        label: "删除",
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
          aria-label="全选当前页用户"
        />
      ),
      headClassName: "w-10",
      cell: (user) => (
        <Checkbox
          checked={selectedIds.has(user.id)}
          onCheckedChange={() => toggleSelected(user.id)}
          aria-label={`选择 ${user.name}`}
        />
      ),
    },
    {
      key: "username",
      header: "用户名",
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
      header: "姓名",
      hideable: true,
      headClassName: "hidden md:table-cell",
      cellClassName: "hidden md:table-cell",
      cell: (user) => user.name,
    },
    {
      key: "email",
      header: "邮箱",
      hideable: true,
      headClassName: "hidden lg:table-cell",
      cellClassName: "hidden text-muted-foreground lg:table-cell",
      cell: (user) => user.email,
    },
    {
      key: "role",
      header: "角色",
      cell: (user) => <RoleBadge roleId={user.roleId} roles={roles} />,
    },
    {
      key: "actions",
      header: "操作",
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
              <span className="sr-only">编辑 {user.name}</span>
            </Button>
          )}
          {hasPermission("users.assign_role") && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleRole(user)}
            >
              <ShieldIcon />
              <span className="sr-only">维护角色</span>
            </Button>
          )}
          {hasPermission("users.edit") && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openReset(user)}
            >
              <KeyIcon />
              <span className="sr-only">重置密码</span>
            </Button>
          )}
          {hasPermission("users.delete") && user.id !== currentUser?.id && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDelete(user)}
            >
              <Trash2Icon />
              <span className="sr-only">删除</span>
            </Button>
          )}
        </div>
      ),
    },
  ]

  const table = useColumnVisibility("users", columns)

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <PageHeader title="用户管理" description="管理团队成员及其角色权限。" />

      <ListShell
        title="用户列表"
        description={`共 ${list.total} 位用户`}
        actions={
          <>
            <InputGroup className="w-full md:w-64">
              <InputGroupInput
                name="q"
                autoComplete="off"
                spellCheck={false}
                placeholder="搜索用户名、姓名或邮箱…"
                aria-label="搜索用户"
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
            {hasPermission("users.create") && (
              <Button onClick={handleAdd} className="w-full md:w-auto">
                <PlusIcon data-icon="inline-start" />
                新增用户
              </Button>
            )}
            {hasPermission("users.edit") && (
              <Button
                variant="outline"
                onClick={openPending}
                className="w-full md:w-auto"
              >
                待审核
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
              itemLabel="位用户"
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
            title: debouncedSearch ? "没有匹配的用户" : "还没有用户",
            description: debouncedSearch
              ? "换个关键词，或清空搜索条件后再试。"
              : "创建第一位用户，或等待注册审核通过。",
            action: debouncedSearch ? (
              <Button variant="outline" onClick={() => setSearch("")}>
                清空搜索
              </Button>
            ) : hasPermission("users.create") ? (
              <Button onClick={handleAdd}>
                <PlusIcon data-icon="inline-start" />
                新增用户
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
                  aria-label={`选择 ${user.name}`}
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
        />
      </ListShell>

      <BulkActionsBar
        count={selectedIds.size}
        entityName="位用户"
        onClear={() => setSelectedIds(new Set())}
      >
        {hasPermission("users.assign_role") && (
          <Button size="sm" onClick={() => setBulkRoleOpen(true)}>
            批量维护角色
          </Button>
        )}
      </BulkActionsBar>

      <FormDialog
        open={bulkRoleOpen}
        onOpenChange={setBulkRoleOpen}
        title="批量维护角色"
        description={`将为已选的 ${selectedIds.size} 位用户设置同一角色。`}
        submitting={bulkSubmitting}
        submitLabel="保存"
        onSubmit={(event) => {
          event.preventDefault()
          void handleBulkRoleSubmit()
        }}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="bulk-role">角色</FieldLabel>
            <Select value={bulkRoleId} onValueChange={setBulkRoleId}>
              <SelectTrigger id="bulk-role" className="w-full">
                <SelectValue placeholder="选择角色" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
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
        title={editingUser ? "编辑用户" : "新增用户"}
        description={
          editingUser ? "修改用户的基本信息。" : "填写以下信息创建新用户。"
        }
        submitting={editSubmitting}
        submitLabel={editingUser ? "保存" : "创建"}
        onSubmit={handleEditSubmit}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="username">用户名</FieldLabel>
            <Input
              name="username"
              autoComplete="off"
              spellCheck={false}
              id="username"
              placeholder="请输入用户名"
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
            <FieldLabel htmlFor="name">姓名</FieldLabel>
            <Input
              name="name"
              autoComplete="off"
              id="name"
              placeholder="请输入姓名"
              value={editForm.name}
              onChange={(event) =>
                setEditForm((form) => ({ ...form, name: event.target.value }))
              }
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">邮箱</FieldLabel>
            <Input
              name="email"
              autoComplete="off"
              spellCheck={false}
              id="email"
              type="email"
              placeholder="请输入邮箱"
              value={editForm.email}
              onChange={(event) =>
                setEditForm((form) => ({ ...form, email: event.target.value }))
              }
              required
            />
          </Field>
          {hasPermission("users.assign_role") && (
            <Field>
              <FieldLabel>角色</FieldLabel>
              <Select
                value={editForm.roleId}
                onValueChange={(value) =>
                  setEditForm((form) => ({ ...form, roleId: value }))
                }
              >
                <SelectTrigger className="w-full" aria-label="角色">
                  <SelectValue placeholder="请选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
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
        title="维护角色"
        description={
          <>
            为{" "}
            <span className="font-medium text-foreground">
              {roleTarget?.name}
            </span>{" "}
            修改角色。
          </>
        }
        submitting={roleSubmitting}
        submitLabel="确认修改"
        onSubmit={(event) => {
          event.preventDefault()
          void handleRoleSubmit()
        }}
      >
        <FieldGroup>
          <Field>
            <FieldLabel>当前角色</FieldLabel>
            <div>
              {roleTarget && (
                <RoleBadge roleId={roleTarget.roleId} roles={roles} />
              )}
            </div>
          </Field>
          <Field>
            <FieldLabel>新角色</FieldLabel>
            <Select value={roleValue} onValueChange={setRoleValue}>
              <SelectTrigger className="w-full" aria-label="新角色">
                <SelectValue placeholder="请选择角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
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
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>
              为 <span className="font-medium">{resetTarget?.name}</span>{" "}
              重置密码
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>新密码</FieldLabel>
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
                  aria-label="重新生成密码"
                  onClick={() => setNewPassword(generatePassword())}
                >
                  <RefreshCwIcon />
                </Button>
                <Button variant="outline" onClick={copyPassword}>
                  复制
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                请将密码发送给用户。
              </p>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <LoadingButton
              onClick={handleResetSubmit}
              loading={resetSubmitting}
            >
              确认重置
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingOpen} onOpenChange={setPendingOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>待审核用户</DialogTitle>
            <DialogDescription>
              共 {pendingUsers.length} 位用户等待审核，已选择{" "}
              {selectedPending.size} 位。
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-auto">
            {pendingLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Spinner />
                加载中…
              </div>
            ) : pendingUsers.length === 0 ? (
              <EmptyState
                icon={UserRoundIcon}
                title="暂无待审核用户"
                description="开启人工审核后，新注册用户会出现在这里。"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          allPendingSelected
                            ? true
                            : somePendingSelected
                              ? "indeterminate"
                              : false
                        }
                        onCheckedChange={toggleAllPending}
                        aria-label="选择全部待审核用户"
                      />
                    </TableHead>
                    <TableHead>用户名</TableHead>
                    <TableHead>姓名</TableHead>
                    <TableHead>邮箱</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPending.has(user.id)}
                          onCheckedChange={() => togglePending(user.id)}
                          aria-label={`选择 ${user.name}`}
                        />
                      </TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              disabled={selectedPending.size === 0 || pendingSubmitting}
              onClick={() => setRejectOpen(true)}
            >
              拒绝 ({selectedPending.size})
            </Button>
            <LoadingButton
              disabled={selectedPending.size === 0}
              loading={pendingSubmitting}
              onClick={handleBatchApprove}
            >
              通过 ({selectedPending.size})
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        targetName={`选中的 ${selectedPending.size} 位用户`}
        description="拒绝后这些账号会被删除。"
        onConfirm={handleBatchReject}
        loading={pendingSubmitting}
      />
    </div>
  )
}
