import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  SearchIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  LockIcon,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  type Role,
  SEED_MENU_PERMISSIONS,
  SEED_OPERATION_PERMISSIONS,
} from "@/lib/permissions"
import { getRoles, createRole, updateRole, deleteRole as apiDeleteRole } from "@/lib/api"

const PAGE_SIZE = 8

export function RolesPage() {
  const { hasPermission } = useAuth()
  const [roles, setRoles] = React.useState<Role[]>([])
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [tableLoading, setTableLoading] = React.useState(true)
  const [editSubmitting, setEditSubmitting] = React.useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = React.useState(false)

  const loadData = React.useCallback(async () => {
    setTableLoading(true)
    const res = await getRoles({ search, page, pageSize: PAGE_SIZE })
    if (res.code === 0) {
      setRoles(res.data.list)
      setTotal(res.data.total)
    }
    setTableLoading(false)
  }, [search, page])

  React.useEffect(() => { loadData() }, [loadData])

  // 新增/编辑对话框
  const [editOpen, setEditOpen] = React.useState(false)
  const [editingRole, setEditingRole] = React.useState<Role | null>(null)
  const [editForm, setEditForm] = React.useState({ name: "", description: "" })
  const [editPermissions, setEditPermissions] = React.useState<string[]>([])

  // 删除确认对话框
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Role | null>(null)

  // 搜索过滤
  const filtered = roles

  // 分页
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  React.useEffect(() => {
    setPage(1)
  }, [search])

  // ---- 新增/编辑 ----

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

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEditSubmitting(true)
    if (editingRole) {
      await updateRole(editingRole.id, {
        name: editForm.name,
        description: editForm.description,
        permissions: editPermissions,
      })
    } else {
      await createRole({
        name: editForm.name,
        description: editForm.description,
        permissions: editPermissions,
      })
    }
    setEditSubmitting(false)
    setEditOpen(false)
    loadData()
  }

  // ---- 权限勾选 ----

  function togglePermission(code: string) {
    setEditPermissions((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  function toggleMenuPermission(code: string) {
    setEditPermissions((prev) => {
      const has = prev.includes(code)
      if (has) {
        // 取消菜单权限时，同时移除其下所有操作权限
        return prev.filter(
          (c) => c !== code && !SEED_OPERATION_PERMISSIONS.some((op) => op.code === c && op.parent === code)
        )
      } else {
        // 勾选菜单权限时，同时勾选其下所有操作权限
        const childOps = SEED_OPERATION_PERMISSIONS.filter((op) => op.parent === code).map((op) => op.code)
        return [...prev, code, ...childOps.filter((c) => !prev.includes(c))]
      }
    })
  }

  function isMenuChecked(code: string): boolean {
    return editPermissions.includes(code)
  }

  function isMenuIndeterminate(code: string): boolean {
    const children = SEED_OPERATION_PERMISSIONS.filter((op) => op.parent === code)
    if (children.length === 0) return false
    const checkedCount = children.filter((c) => editPermissions.includes(c.code)).length
    return checkedCount > 0 && checkedCount < children.length
  }

  // ---- 删除 ----

  function handleDelete(role: Role) {
    setDeleteTarget(role)
    setDeleteOpen(true)
  }

  async function handleDeleteConfirm() {
    setDeleteSubmitting(true)
    if (deleteTarget) {
      await apiDeleteRole(deleteTarget.id)
    }
    setDeleteSubmitting(false)
    setDeleteOpen(false)
    loadData()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">角色管理</h1>
        <p className="text-muted-foreground">管理系统角色及其权限分配。</p>
      </div>

      {tableLoading ? (
        <TableCardSkeleton colSpan={5} />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>角色列表</CardTitle>
                <CardDescription>共 {filtered.length} 个角色</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-64">
                  <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="搜索角色名称..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                {hasPermission("roles.create") && (
                  <Button onClick={handleAdd} className="w-full sm:w-auto">
                  <PlusIcon data-icon="inline-start" />
                  新增角色
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>角色名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>权限数</TableHead>
                <TableHead>类型</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="text-muted-foreground">{role.description}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{role.permissions.length}</Badge>
                  </TableCell>
                  <TableCell>
                    {role.isPreset ? (
                      <Badge variant="outline">
                        <LockIcon data-icon="inline-start" />
                        预设
                      </Badge>
                    ) : (
                      <Badge variant="secondary">自定义</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {hasPermission("roles.edit") && (
                        <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(role)}>
                          <PencilIcon data-icon="inline-start" />
                          <span className="sr-only">编辑</span>
                        </Button>
                      )}
                      {!role.isPreset && hasPermission("roles.delete") && (
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(role)}>
                          <Trash2Icon data-icon="inline-start" />
                          <span className="sr-only">删除</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!tableLoading && roles.length === 0 && <TableEmptyRow colSpan={5} />}
            </TableBody>
          </Table>

          {/* 分页 */}
          <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
        </CardContent>
      </Card>
      )}

      {/* 新增/编辑对话框 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRole ? "编辑角色" : "新增角色"}</DialogTitle>
            <DialogDescription>
              {editingRole ? "修改角色信息和权限分配。" : "填写角色信息并分配权限。"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="flex flex-col gap-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="role-name">角色名称</FieldLabel>
                  <Input
                    id="role-name"
                    placeholder="请输入角色名称"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="role-desc">描述</FieldLabel>
                  <Input
                    id="role-desc"
                    placeholder="请输入角色描述"
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </Field>
              </FieldGroup>

              <Separator />

              {/* 权限分配 */}
              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium">权限分配</span>

                {/* 菜单权限 */}
                <div className="flex max-h-[50vh] flex-col gap-2 overflow-auto">
                  <span className="text-xs font-medium text-muted-foreground">菜单权限</span>
                  {SEED_MENU_PERMISSIONS.map((perm) => {
                    const children = SEED_OPERATION_PERMISSIONS.filter((op) => op.parent === perm.code)
                    const hasChildren = children.length > 0
                    return (
                      <div key={perm.code} className="flex flex-col gap-1">
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={hasChildren ? isMenuChecked(perm.code) || isMenuIndeterminate(perm.code) : isMenuChecked(perm.code)}
                            onCheckedChange={() => toggleMenuPermission(perm.code)}
                          />
                          {perm.name}
                        </label>
                        {hasChildren && isMenuChecked(perm.code) && (
                          <div className="ml-6 flex flex-wrap gap-x-4 gap-y-1">
                            {children.map((child) => (
                              <label key={child.code} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Checkbox
                                  checked={editPermissions.includes(child.code)}
                                  onCheckedChange={() => togglePermission(child.code)}
                                />
                                {child.name}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <LoadingButton type="submit" loading={editSubmitting}>
                保存
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
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
