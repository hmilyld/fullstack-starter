import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/shared/loading-button"
import { TableEmptyRow, TableCardSkeleton } from "@/components/shared/table-states"
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog"
import { Pagination } from "@/components/shared/pagination"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SearchIcon,
  PlusIcon,
  PencilIcon,
  ShieldIcon,
  Trash2Icon,
  KeyIcon,
} from "lucide-react"
import { appToast } from "@/lib/toast"
import { useAuth } from "@/lib/auth-context"
import type { User, Role } from "@/types/api"
import { getUsers, createUser, updateUser, deleteUser as apiDeleteUser, getRoles, resetPassword, batchUpdateRole } from "@/lib/api"

const PAGE_SIZE = 8

function getRoleBadge(roleName: string) {
  if (roleName === "管理员") return <Badge variant="default">{roleName}</Badge>
  if (roleName === "普通用户") return <Badge variant="secondary">{roleName}</Badge>
  return <Badge variant="outline">{roleName}</Badge>
}

function findRoleName(roleId: string, roles: Role[]): string {
  return roles.find((r) => r.id === roleId)?.name ?? "未知角色"
}

export function UsersPage() {
  const { hasPermission } = useAuth()
  const [users, setUsers] = React.useState<User[]>([])
  const [roles, setRoles] = React.useState<Role[]>([])

  React.useEffect(() => {
    getRoles({ pageSize: 100 }).then((res) => {
      if (res.code === 0) setRoles(res.data.list)
    })
  }, [])
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [tableLoading, setTableLoading] = React.useState(true)
  const [editSubmitting, setEditSubmitting] = React.useState(false)
  const [roleSubmitting, setRoleSubmitting] = React.useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = React.useState(false)

  const loadData = React.useCallback(async () => {
    setTableLoading(true)
    const res = await getUsers({ search, page, pageSize: PAGE_SIZE })
    if (res.code === 0) {
      setUsers(res.data.list)
      setTotal(res.data.total)
    }
    setTableLoading(false)
  }, [search, page])

  React.useEffect(() => { loadData() }, [loadData])

  // 新增/编辑对话框
  const [editOpen, setEditOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<User | null>(null)
  const [editForm, setEditForm] = React.useState({ username: "", name: "", email: "", roleId: "user" })

  // 角色维护对话框
  const [roleOpen, setRoleOpen] = React.useState(false)
  const [roleTarget, setRoleTarget] = React.useState<User | null>(null)
  const [roleValue, setRoleValue] = React.useState("")

  // 删除确认对话框
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<User | null>(null)

  // 待审核对话框
  const [pendingOpen, setPendingOpen] = React.useState(false)
  const [pendingUsers, setPendingUsers] = React.useState<User[]>([])
  const [selectedPending, setSelectedPending] = React.useState<Set<string>>(new Set())
  const [pendingLoading, setPendingLoading] = React.useState(false)
  const [pendingSubmitting, setPendingSubmitting] = React.useState(false)

  // 重置密码对话框
  const [resetOpen, setResetOpen] = React.useState(false)
  const [resetTarget, setResetTarget] = React.useState<User | null>(null)
  const [newPassword, setNewPassword] = React.useState("")
  const [resetSubmitting, setResetSubmitting] = React.useState(false)

  // 搜索过滤
  const filtered = users

  // 分页
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  React.useEffect(() => {
    setPage(1)
  }, [search])

  // 打开新增
  function handleAdd() {
    setEditingUser(null)
    setEditForm({ username: "", name: "", email: "", roleId: "user" })
    setEditOpen(true)
  }

  // 打开编辑
  function handleEdit(user: User) {
    setEditingUser(user)
    setEditForm({ username: user.username, name: user.name, email: user.email, roleId: user.roleId })
    setEditOpen(true)
  }

  // 提交新增/编辑
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEditSubmitting(true)
    if (editingUser) {
      await updateUser(editingUser.id, {
        username: editForm.username,
        name: editForm.name,
        email: editForm.email,
        roleId: editForm.roleId,
      })
    } else {
      await createUser({
        username: editForm.username,
        name: editForm.name,
        email: editForm.email,
        roleId: editForm.roleId,
      })
    }
    setEditSubmitting(false)
    setEditOpen(false)
    loadData()
  }

  // 打开角色维护
  function handleRole(user: User) {
    setRoleTarget(user)
    setRoleValue(user.roleId)
    setRoleOpen(true)
  }

  // 提交角色修改
  async function handleRoleSubmit() {
    setRoleSubmitting(true)
    if (roleTarget) {
      await updateUser(roleTarget.id, { roleId: roleValue })
    }
    setRoleSubmitting(false)
    setRoleOpen(false)
    loadData()
  }

  // 打开删除确认
  function handleDelete(user: User) {
    setDeleteTarget(user)
    setDeleteOpen(true)
  }

  // 确认删除
  async function handleDeleteConfirm() {
    setDeleteSubmitting(true)
    if (deleteTarget) {
      await apiDeleteUser(deleteTarget.id)
    }
    setDeleteSubmitting(false)
    setDeleteOpen(false)
    loadData()
  }

  // 打开待审核对话框
  async function openPending() {
    setPendingOpen(true)
    setPendingLoading(true)
    setSelectedPending(new Set())
    const res = await getUsers({ pageSize: 100 })
    if (res.code === 0) {
      setPendingUsers(res.data.list.filter((u) => u.roleId === "pending_review"))
    }
    setPendingLoading(false)
  }

  // 切换选中状态
  function togglePending(id: string) {
    setSelectedPending((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // 全选/取消全选
  function toggleAllPending() {
    if (selectedPending.size === pendingUsers.length) {
      setSelectedPending(new Set())
    } else {
      setSelectedPending(new Set(pendingUsers.map((u) => u.id)))
    }
  }

  // 批量通过
  async function handleBatchApprove() {
    if (selectedPending.size === 0) return
    setPendingSubmitting(true)
    const userIds = Array.from(selectedPending).map(Number)
    await batchUpdateRole(userIds, "user")
    appToast.success(`已通过 ${userIds.length} 位用户审核`)
    setPendingSubmitting(false)
    setPendingOpen(false)
    loadData()
  }

  // 批量拒绝（删除）
  async function handleBatchReject() {
    if (selectedPending.size === 0) return
    setPendingSubmitting(true)
    for (const id of selectedPending) {
      await apiDeleteUser(id)
    }
    appToast.success(`已拒绝 ${selectedPending.size} 位用户`)
    setPendingSubmitting(false)
    setPendingOpen(false)
    loadData()
  }

  // 打开重置密码
  function openReset(user: User) {
    setResetTarget(user)
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let pwd = ""
    for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    setNewPassword(pwd)
    setResetOpen(true)
  }

  // 确认重置密码
  async function handleResetSubmit() {
    if (!resetTarget) return
    setResetSubmitting(true)
    await resetPassword(resetTarget.id, newPassword)
    setResetSubmitting(false)
    setResetOpen(false)
    loadData()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">用户管理</h1>
        <p className="text-muted-foreground">管理团队成员及其角色权限。</p>
      </div>

      {tableLoading ? (
        <TableCardSkeleton colSpan={5} />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>用户列表</CardTitle>
                <CardDescription>共 {filtered.length} 位用户</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-64">
                  <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="搜索用户名、姓名或邮箱..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                {hasPermission("users.create") && (
                  <Button onClick={handleAdd} className="w-full sm:w-auto">
                    <PlusIcon data-icon="inline-start" />
                    新增用户
                  </Button>
                )}
              {hasPermission("users.edit") && (
                <Button variant="outline" onClick={openPending} className="w-full sm:w-auto">
                  待审核
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户名</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>角色</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.slice(0, 1)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{user.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>{getRoleBadge(findRoleName(user.roleId, roles))}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {hasPermission("users.edit") && (
                        <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(user)}>
                          <PencilIcon data-icon="inline-start" />
                          <span className="sr-only">编辑</span>
                        </Button>
                      )}
                      {hasPermission("users.assign_role") && (
                        <Button variant="ghost" size="icon-sm" onClick={() => handleRole(user)}>
                          <ShieldIcon data-icon="inline-start" />
                          <span className="sr-only">维护角色</span>
                        </Button>
                      )}
                      {hasPermission("users.delete") && (
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(user)}>
                          <Trash2Icon data-icon="inline-start" />
                          <span className="sr-only">删除</span>
                        </Button>
                      )}
                      {hasPermission("users.edit") && (
                        <Button variant="ghost" size="icon-sm" onClick={() => openReset(user)}>
                          <KeyIcon data-icon="inline-start" />
                          <span className="sr-only">重置密码</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!tableLoading && users.length === 0 && <TableEmptyRow colSpan={5} />}
            </TableBody>
          </Table>

          {/* 分页 */}
          <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
        </CardContent>
      </Card>
      )}

      {/* 新增/编辑对话框 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "编辑用户" : "新增用户"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "修改用户的基本信息。" : "填写以下信息创建新用户。"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">用户名</FieldLabel>
                <Input
                  id="username"
                  placeholder="请输入用户名"
                  value={editForm.username}
                  onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="name">姓名</FieldLabel>
                <Input
                  id="name"
                  placeholder="请输入姓名"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">邮箱</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入邮箱"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </Field>
              <Field>
                <FieldLabel>角色</FieldLabel>
                <Select value={editForm.roleId} onValueChange={(v) => setEditForm((f) => ({ ...f, roleId: v }))}>
                  <SelectTrigger className="w-full">
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
            <DialogFooter className="mt-4">
              <LoadingButton type="submit" loading={editSubmitting}>
                {editingUser ? "保存" : "创建"}
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 角色维护对话框 */}
      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>维护角色</DialogTitle>
            <DialogDescription>
              为 <span className="font-medium text-foreground">{roleTarget?.name}</span> 修改角色。
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <Field>
              <FieldLabel>当前角色</FieldLabel>
              <div>{roleTarget && getRoleBadge(findRoleName(roleTarget.roleId, roles))}</div>
            </Field>
            <Field>
              <FieldLabel>新角色</FieldLabel>
              <Select value={roleValue} onValueChange={setRoleValue}>
                <SelectTrigger className="w-full">
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
          </div>
          <DialogFooter>
            <LoadingButton onClick={handleRoleSubmit} loading={roleSubmitting}>
              确认修改
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        targetName={deleteTarget?.name ?? ""}
        onConfirm={handleDeleteConfirm}
        loading={deleteSubmitting}
      />

      {/* 重置密码对话框 */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>
              为 <span className="font-medium">{resetTarget?.name}</span> 重置密码
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Field>
              <FieldLabel>新密码</FieldLabel>
              <div className="flex gap-2">
                <Input value={newPassword} readOnly />
                <Button variant="outline" onClick={() => {
                  navigator.clipboard.writeText(newPassword)
                  appToast.success("密码已复制到剪贴板")
                }}>
                  复制
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">请将密码发送给用户。</span>
            </Field>
          </div>
          <DialogFooter>
            <LoadingButton onClick={handleResetSubmit} loading={resetSubmitting}>
              确认重置
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 待审核对话框 */}
      <Dialog open={pendingOpen} onOpenChange={setPendingOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>待审核用户</DialogTitle>
            <DialogDescription>
              共 {pendingUsers.length} 位用户等待审核，已选择 {selectedPending.size} 位。
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-auto">
            {pendingLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                加载中...
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                暂无待审核用户
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedPending.size === pendingUsers.length && pendingUsers.length > 0}
                        onCheckedChange={toggleAllPending}
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
              onClick={handleBatchReject}
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
    </div>
  )
}
