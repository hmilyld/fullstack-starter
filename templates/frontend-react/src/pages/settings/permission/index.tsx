import * as React from "react"
import { Link } from "react-router"
import {
  ChevronRightIcon,
  KeyRoundIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"

import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { FormDialog } from "@/components/shared/form-dialog"
import { InlineError } from "@/components/shared/inline-error"
import { ListShell } from "@/components/shared/list-shell"
import { LoadingButton } from "@/components/shared/loading-button"
import { PageHeader } from "@/components/shared/page-header"
import { RowActions, type RowAction } from "@/components/shared/row-actions"
import { TableSkeletonRow } from "@/components/shared/table-states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  createPermission,
  deletePermission as apiDeletePermission,
  getPermissions,
  syncPermissions,
  updatePermission,
} from "@/api/permission"
import { useAuth } from "@/lib/auth-context"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { Permission } from "@/types/permission"

type PermissionTreeNode = Permission & {
  children: Permission[]
}

function buildTree(
  menuPermissions: Permission[],
  operationPermissions: Permission[]
): PermissionTreeNode[] {
  return menuPermissions.map((menu) => ({
    ...menu,
    children: operationPermissions.filter(
      (operation) => operation.parent === menu.code
    ),
  }))
}

export function PermissionPage() {
  const { hasPermission } = useAuth()
  const [menuPermissions, setMenuPermissions] = React.useState<Permission[]>([])
  const [operationPermissions, setOperationPermissions] = React.useState<
    Permission[]
  >([])
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set())
  const [search, setSearch] = React.useState("")
  const [tableLoading, setTableLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [syncing, setSyncing] = React.useState(false)

  const loadData = React.useCallback(async () => {
    setTableLoading(true)
    setError(null)
    const [menuRes, opRes] = await Promise.all([
      getPermissions({ type: "menu" }),
      getPermissions({ type: "operation" }),
    ])
    if (menuRes.code === 0) setMenuPermissions(menuRes.data)
    else setError(menuRes.message || "加载菜单权限失败")
    if (opRes.code === 0) setOperationPermissions(opRes.data)
    else setError(opRes.message || "加载操作权限失败")
    setTableLoading(false)
  }, [])

  React.useEffect(() => {
    void loadData()
  }, [loadData])

  // 新增/编辑对话框
  const [editOpen, setEditOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<Permission | null>(null)
  const [editForm, setEditForm] = React.useState({
    code: "",
    name: "",
    parent: "",
  })
  const [editSubmitting, setEditSubmitting] = React.useState(false)

  // 删除确认对话框
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Permission | null>(
    null
  )
  const [deleteSubmitting, setDeleteSubmitting] = React.useState(false)

  const tree = React.useMemo(() => {
    const fullTree = buildTree(menuPermissions, operationPermissions)
    if (!search) return fullTree

    const keyword = search.toLowerCase()
    return fullTree
      .map((node) => {
        const nodeMatch =
          node.code.toLowerCase().includes(keyword) ||
          node.name.toLowerCase().includes(keyword)
        const matchedChildren = node.children.filter(
          (child) =>
            child.code.toLowerCase().includes(keyword) ||
            child.name.toLowerCase().includes(keyword)
        )
        if (nodeMatch || matchedChildren.length > 0) {
          return {
            ...node,
            children: nodeMatch ? node.children : matchedChildren,
          }
        }
        return null
      })
      .filter((node): node is PermissionTreeNode => node !== null)
  }, [menuPermissions, operationPermissions, search])

  // 搜索时展开所有匹配节点
  React.useEffect(() => {
    if (search) {
      setExpanded(new Set(tree.map((node) => node.code)))
    }
  }, [search, tree])

  function toggleExpand(code: string) {
    setExpanded((previous) => {
      const next = new Set(previous)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  function handleAddOperation(parentCode: string) {
    setEditingItem(null)
    setEditForm({ code: "", name: "", parent: parentCode })
    setEditOpen(true)
  }

  async function handleSync() {
    setSyncing(true)
    const res = await syncPermissions()
    setSyncing(false)
    if (res.code !== 0) {
      appToast.error(res.message || "同步失败")
      return
    }
    appToast.success(
      `同步成功：新增 ${res.data.added.length} 个，更新 ${res.data.updated.length} 个，管理员授予 ${res.data.granted.length} 个`
    )
    void loadData()
  }

  function handleEdit(item: Permission) {
    setEditingItem(item)
    setEditForm({ code: item.code, name: item.name, parent: item.parent ?? "" })
    setEditOpen(true)
  }

  async function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editForm.name.trim()) {
      appToast.error("请输入权限名称")
      return
    }
    if (!editingItem && !editForm.parent) {
      appToast.error("请选择所属菜单")
      return
    }

    setEditSubmitting(true)
    const res = editingItem
      ? await updatePermission(editingItem.code, {
          name: editForm.name,
          parent: editForm.parent || undefined,
        })
      : await createPermission({
          code: editForm.code,
          name: editForm.name,
          type: "operation",
          parent: editForm.parent || undefined,
        })
    setEditSubmitting(false)
    if (res.code !== 0) {
      appToast.error(res.message || "操作失败")
      return
    }
    appToast.success(editingItem ? "保存成功" : "创建成功")
    setEditOpen(false)
    void loadData()
  }

  function handleDelete(item: Permission) {
    setDeleteTarget(item)
    setDeleteOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleteSubmitting(true)
    const res = await apiDeletePermission(deleteTarget.code)
    setDeleteSubmitting(false)
    if (res.code !== 0) {
      appToast.error(res.message || "删除失败")
      return
    }
    appToast.success("删除成功")
    setDeleteOpen(false)
    void loadData()
  }

  function buildPermissionActions(permission: Permission): RowAction[] {
    const actions: RowAction[] = []
    if (hasPermission("permissions.edit")) {
      actions.push({
        label: "编辑",
        icon: PencilIcon,
        onSelect: () => handleEdit(permission),
      })
    }
    if (hasPermission("permissions.delete")) {
      actions.push({
        label: "删除",
        icon: Trash2Icon,
        destructive: true,
        separatorBefore: true,
        onSelect: () => handleDelete(permission),
      })
    }
    return actions
  }

  const hasPermissions = tree.length > 0

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <PageHeader
        title="权限管理"
        description="管理系统的菜单权限和操作权限。"
      />

      <ListShell
        title="权限列表"
        description={`共 ${menuPermissions.length} 个菜单权限，${operationPermissions.length} 个操作权限`}
        actions={
          <>
            <InputGroup className="w-full md:w-64">
              <InputGroupInput
                placeholder="搜索编码或名称…"
                aria-label="搜索权限"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
            </InputGroup>
            {hasPermission("permissions.create") && (
              <>
                <LoadingButton
                  variant="outline"
                  onClick={handleSync}
                  loading={syncing}
                  className="w-full md:w-auto"
                >
                  {!syncing && <RefreshCwIcon data-icon="inline-start" />}
                  同步权限
                </LoadingButton>
                <Button asChild className="w-full md:w-auto">
                  <Link to="/settings/menu">
                    <PlusIcon data-icon="inline-start" />
                    菜单管理
                  </Link>
                </Button>
              </>
            )}
          </>
        }
      >
        {error && hasPermissions && (
          <InlineError message={error} onRetry={loadData} />
        )}

        {tableLoading ? (
          <TableSkeletonRow colSpan={4} />
        ) : error && !hasPermissions ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : !hasPermissions ? (
          <EmptyState
            icon={KeyRoundIcon}
            title={search ? "没有匹配的权限" : "还没有权限"}
            description={
              search
                ? "换个关键词，或清空搜索条件后再试。"
                : "在菜单管理中新增菜单后，会自动生成对应的菜单权限。"
            }
            action={
              search ? (
                <Button variant="outline" onClick={() => setSearch("")}>
                  清空搜索
                </Button>
              ) : hasPermission("permissions.create") ? (
                <Button asChild>
                  <Link to="/settings/menu">前往菜单管理</Link>
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="flex flex-col gap-2 md:hidden">
              {tree.map((node) => {
                const isExpanded = expanded.has(node.code)

                return (
                  <div key={node.code} className="rounded-2xl border bg-card">
                    <div className="flex items-start justify-between gap-2 p-4">
                      <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{node.name}</span>
                          <Badge variant="default">菜单</Badge>
                        </div>
                        <code className="truncate text-xs text-muted-foreground">
                          {node.code}
                        </code>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {hasPermission("permissions.create") && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`新增 ${node.name} 的子权限`}
                            onClick={() => handleAddOperation(node.code)}
                          >
                            <PlusIcon />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`${isExpanded ? "收起" : "展开"} ${node.name}`}
                          aria-expanded={isExpanded}
                          onClick={() => toggleExpand(node.code)}
                        >
                          <ChevronRightIcon
                            className={cn(
                              "transition-transform",
                              isExpanded && "rotate-90"
                            )}
                          />
                        </Button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t p-2">
                        {node.children.map((child) => (
                          <div
                            key={child.code}
                            className="flex items-start justify-between gap-2 rounded-xl px-2 py-2"
                          >
                            <div className="flex min-w-0 flex-col gap-0.5">
                              <span className="truncate text-sm">
                                {child.name}
                              </span>
                              <code className="truncate text-xs text-muted-foreground">
                                {child.code}
                              </code>
                            </div>
                            <RowActions
                              actions={buildPermissionActions(child)}
                            />
                          </div>
                        ))}
                        {node.children.length === 0 && (
                          <p className="px-2 py-3 text-sm text-muted-foreground">
                            暂无操作权限
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">权限名称</TableHead>
                    <TableHead className="w-[25%]">权限编码</TableHead>
                    <TableHead className="w-[10%]">类型</TableHead>
                    <TableHead className="w-[25%] text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tree.map((node) => {
                    const isExpanded = expanded.has(node.code)

                    return (
                      <React.Fragment key={node.code}>
                        <TableRow className="bg-muted/30">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                aria-expanded={isExpanded}
                                aria-label={`${isExpanded ? "收起" : "展开"} ${node.name}`}
                                onClick={() => toggleExpand(node.code)}
                              >
                                <ChevronRightIcon
                                  className={cn(
                                    "transition-transform",
                                    isExpanded && "rotate-90"
                                  )}
                                />
                              </Button>
                              <span className="font-medium">{node.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {node.code}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">菜单</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {hasPermission("permissions.create") && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => handleAddOperation(node.code)}
                                >
                                  <PlusIcon />
                                  <span className="sr-only">
                                    新增 {node.name} 的子权限
                                  </span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>

                        {isExpanded &&
                          node.children.map((child) => (
                            <TableRow key={child.code}>
                              <TableCell>
                                <div className="flex items-center gap-2 pl-9">
                                  <span>{child.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {child.code}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">操作</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {hasPermission("permissions.edit") && (
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => handleEdit(child)}
                                    >
                                      <PencilIcon />
                                      <span className="sr-only">
                                        编辑 {child.name}
                                      </span>
                                    </Button>
                                  )}
                                  {hasPermission("permissions.delete") && (
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => handleDelete(child)}
                                    >
                                      <Trash2Icon />
                                      <span className="sr-only">
                                        删除 {child.name}
                                      </span>
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}

                        {isExpanded && node.children.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4}>
                              <div className="pl-9 text-sm text-muted-foreground">
                                暂无操作权限
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </ListShell>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title={editingItem ? "编辑权限" : "新增操作权限"}
        description={
          editingItem
            ? "修改权限的基本信息。"
            : "填写以下信息创建新的操作权限。"
        }
        submitting={editSubmitting}
        onSubmit={handleEditSubmit}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="perm-code">权限编码</FieldLabel>
            <Input
              id="perm-code"
              placeholder="如：users.create"
              value={editForm.code}
              onChange={(event) =>
                setEditForm((form) => ({ ...form, code: event.target.value }))
              }
              required
              disabled={!!editingItem}
              pattern="^[a-z0-9_.-]+$"
              title="只能包含小写字母、数字、点、下划线和连字符"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="perm-name">权限名称</FieldLabel>
            <Input
              id="perm-name"
              placeholder="如：新增用户"
              value={editForm.name}
              onChange={(event) =>
                setEditForm((form) => ({ ...form, name: event.target.value }))
              }
              required
            />
          </Field>
          <Field>
            <FieldLabel>所属菜单</FieldLabel>
            <Select
              value={editForm.parent}
              onValueChange={(value) =>
                setEditForm((form) => ({ ...form, parent: value }))
              }
            >
              <SelectTrigger className="w-full" aria-label="所属菜单">
                <SelectValue placeholder="请选择所属菜单" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {menuPermissions.map((permission) => (
                    <SelectItem key={permission.code} value={permission.code}>
                      {permission.name}
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
        description="删除后，已授予该权限的角色会同步失去此权限。"
        onConfirm={handleDeleteConfirm}
        loading={deleteSubmitting}
      />
    </div>
  )
}
