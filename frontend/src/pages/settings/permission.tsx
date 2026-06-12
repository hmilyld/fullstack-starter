import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/shared/loading-button"
import { TableLoadingRow, TableEmptyRow } from "@/components/shared/table-states"
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog"
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
  Trash2Icon,
  ChevronRightIcon,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  type Permission,
} from "@/lib/permissions"
import {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission as apiDeletePermission,
} from "@/lib/api"

type PermissionTreeNode = Permission & {
  children: Permission[]
}

function buildTree(menuPermissions: Permission[], operationPermissions: Permission[]): PermissionTreeNode[] {
  return menuPermissions.map((menu) => ({
    ...menu,
    children: operationPermissions.filter((op) => op.parent === menu.code),
  }))
}

export function PermissionPage() {
  const { hasPermission } = useAuth()
  const [menuPermissions, setMenuPermissions] = React.useState<Permission[]>([])
  const [operationPermissions, setOperationPermissions] = React.useState<Permission[]>([])
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set())
  const [search, setSearch] = React.useState("")
  const [tableLoading, setTableLoading] = React.useState(true)
  const [editSubmitting, setEditSubmitting] = React.useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = React.useState(false)

  const loadData = React.useCallback(async () => {
    setTableLoading(true)
    const [menuRes, opRes] = await Promise.all([
      getPermissions({ type: "menu" }),
      getPermissions({ type: "operation" }),
    ])
    if (menuRes.code === 0) setMenuPermissions(menuRes.data)
    if (opRes.code === 0) setOperationPermissions(opRes.data)
    setTableLoading(false)
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  // 新增/编辑对话框
  const [editOpen, setEditOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<Permission | null>(null)
  const [editParentCode, setEditParentCode] = React.useState<string | null>(null)
  const [editForm, setEditForm] = React.useState({ code: "", name: "", parent: "" })

  // 删除确认对话框
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Permission | null>(null)
  const [deleteIsMenu, setDeleteIsMenu] = React.useState(false)

  // 构建树并搜索过滤
  const tree = React.useMemo(() => {
    const fullTree = buildTree(menuPermissions, operationPermissions)
    if (!search) return fullTree

    const lowerSearch = search.toLowerCase()
    return fullTree
      .map((node) => {
        const nodeMatch = node.code.toLowerCase().includes(lowerSearch) || node.name.toLowerCase().includes(lowerSearch)
        const matchedChildren = node.children.filter(
          (c) => c.code.toLowerCase().includes(lowerSearch) || c.name.toLowerCase().includes(lowerSearch)
        )
        if (nodeMatch || matchedChildren.length > 0) {
          return {
            ...node,
            children: nodeMatch ? node.children : matchedChildren,
          }
        }
        return null
      })
      .filter(Boolean) as PermissionTreeNode[]
  }, [menuPermissions, operationPermissions, search])

  // 搜索时展开所有匹配节点
  React.useEffect(() => {
    if (search) {
      setExpanded(new Set(tree.map((n) => n.code)))
    }
  }, [search, tree])

  function toggleExpand(code: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }
      return next
    })
  }

  // ---- 新增 ----

  function handleAddMenu() {
    setEditingItem(null)
    setEditParentCode(null)
    setEditForm({ code: "", name: "", parent: "" })
    setEditOpen(true)
  }

  function handleAddOperation(parentCode: string) {
    setEditingItem(null)
    setEditParentCode(parentCode)
    setEditForm({ code: "", name: "", parent: parentCode })
    setEditOpen(true)
  }

  // ---- 编辑 ----

  function handleEdit(item: Permission, parentCode?: string) {
    setEditingItem(item)
    setEditParentCode(parentCode ?? null)
    setEditForm({ code: item.code, name: item.name, parent: item.parent ?? "" })
    setEditOpen(true)
  }

  // ---- 提交 ----

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEditSubmitting(true)
    const isMenu = !editParentCode

    if (editingItem) {
      await updatePermission(editingItem.code, {
        name: editForm.name,
        parent: isMenu ? undefined : editForm.parent || undefined,
      })
    } else {
      const newItem: Permission = {
        code: editForm.code,
        name: editForm.name,
        type: isMenu ? "menu" : "operation",
        parent: isMenu ? undefined : editForm.parent || undefined,
      }
      await createPermission(newItem)
    }
    setEditSubmitting(false)
    setEditOpen(false)
    loadData()
  }

  // ---- 删除 ----

  function handleDelete(item: Permission, isMenu: boolean) {
    setDeleteTarget(item)
    setDeleteIsMenu(isMenu)
    setDeleteOpen(true)
  }

  async function handleDeleteConfirm() {
    setDeleteSubmitting(true)
    if (deleteTarget) {
      await apiDeletePermission(deleteTarget.code)
      if (deleteIsMenu) {
        setExpanded((prev) => {
          const next = new Set(prev)
          next.delete(deleteTarget.code)
          return next
        })
      }
    }
    setDeleteSubmitting(false)
    setDeleteOpen(false)
    loadData()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">权限管理</h1>
        <p className="text-muted-foreground">管理系统的菜单权限和操作权限。</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>权限列表</CardTitle>
              <CardDescription>
                共 {menuPermissions.length} 个菜单权限，{operationPermissions.length} 个操作权限
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索编码或名称..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              {hasPermission("permissions.create") && (
                <Button onClick={handleAddMenu} className="w-full sm:w-auto">
                  <PlusIcon data-icon="inline-start" />
                  新增菜单
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: "40%" }}>权限名称</TableHead>
                <TableHead style={{ width: "25%" }}>权限编码</TableHead>
                <TableHead style={{ width: "10%" }}>类型</TableHead>
                <TableHead className="text-right" style={{ width: "25%" }}>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tree.map((node) => (
                <React.Fragment key={node.code}>
                  {/* 菜单权限（父节点） */}
                  <TableRow className="bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="flex size-5 items-center justify-center rounded hover:bg-muted"
                          onClick={() => toggleExpand(node.code)}
                        >
                          <ChevronRightIcon
                            className="size-4 transition-transform duration-200"
                            style={{ transform: expanded.has(node.code) ? "rotate(90deg)" : "rotate(0deg)" }}
                          />
                        </button>
                        <span className="font-medium">{node.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{node.code}</TableCell>
                    <TableCell>
                      <Badge variant="default">菜单</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {hasPermission("permissions.create") && (
                          <Button variant="ghost" size="icon-sm" onClick={() => handleAddOperation(node.code)}>
                            <PlusIcon data-icon="inline-start" />
                            <span className="sr-only">新增子权限</span>
                          </Button>
                        )}
                        {hasPermission("permissions.edit") && (
                          <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(node)}>
                            <PencilIcon data-icon="inline-start" />
                            <span className="sr-only">编辑</span>
                          </Button>
                        )}
                        {hasPermission("permissions.delete") && (
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(node, true)}>
                            <Trash2Icon data-icon="inline-start" />
                            <span className="sr-only">删除</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* 操作权限（子节点） */}
                  {expanded.has(node.code) &&
                    node.children.map((child) => (
                      <TableRow key={child.code}>
                        <TableCell>
                          <div className="flex items-center gap-2 pl-7">
                            <span>{child.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{child.code}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">操作</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {hasPermission("permissions.edit") && (
                              <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(child, node.code)}>
                                <PencilIcon data-icon="inline-start" />
                                <span className="sr-only">编辑</span>
                              </Button>
                            )}
                            {hasPermission("permissions.delete") && (
                              <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(child, false)}>
                                <Trash2Icon data-icon="inline-start" />
                                <span className="sr-only">删除</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}

                  {/* 空子节点提示 */}
                  {expanded.has(node.code) && node.children.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <div className="pl-7 text-sm text-muted-foreground">暂无操作权限</div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
              {tableLoading && <TableLoadingRow colSpan={4} />}
              {!tableLoading && tree.length === 0 && <TableEmptyRow colSpan={4} />}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新增/编辑对话框 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "编辑权限" : editParentCode ? "新增操作权限" : "新增菜单权限"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "修改权限的基本信息。" : "填写以下信息创建新权限。"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="perm-code">权限编码</FieldLabel>
                <Input
                  id="perm-code"
                  placeholder={editParentCode ? "如：users.create" : "如：dashboard"}
                  value={editForm.code}
                  onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))}
                  required
                  disabled={!!editingItem}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="perm-name">权限名称</FieldLabel>
                <Input
                  id="perm-name"
                  placeholder="如：仪表盘"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </Field>
              {editParentCode && !editingItem && (
                <Field>
                  <FieldLabel>所属菜单</FieldLabel>
                  <Select value={editForm.parent} onValueChange={(v) => setEditForm((f) => ({ ...f, parent: v }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="请选择所属菜单" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {menuPermissions.map((perm) => (
                          <SelectItem key={perm.code} value={perm.code}>
                            {perm.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </FieldGroup>
            <DialogFooter className="mt-4">
              <LoadingButton type="submit" loading={editSubmitting}>
                {editingItem ? "保存" : "创建"}
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
        description={deleteIsMenu ? "该菜单下的所有操作权限也将被删除。" : undefined}
        onConfirm={handleDeleteConfirm}
        loading={deleteSubmitting}
      />
    </div>
  )
}
