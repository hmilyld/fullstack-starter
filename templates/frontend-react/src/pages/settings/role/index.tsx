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
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { FormDialog } from "@/components/shared/form-dialog"
import { InlineError } from "@/components/shared/inline-error"
import { ListShell } from "@/components/shared/list-shell"
import { PageHeader } from "@/components/shared/page-header"
import { RecordCard } from "@/components/shared/record-card"
import { RowActions, type RowAction } from "@/components/shared/row-actions"
import { TablePagination } from "@/components/shared/table-pagination"
import { TableSkeletonRow } from "@/components/shared/table-states"
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
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { usePagedList } from "@/hooks/use-paged-list"
import { useUrlListState } from "@/hooks/use-url-list-state"
import { useAuth } from "@/lib/auth-context"
import { appToast } from "@/lib/toast"
import type { Permission } from "@/types/permission"
import type { Role } from "@/types/role"

const PAGE_SIZE = 8

export function RolesPage() {
  const { hasPermission } = useAuth()
  const { search, page, setSearch, setPage } = useUrlListState()
  const debouncedSearch = useDebouncedValue(search)
  const list = usePagedList<Role, { search: string }>({
    fetcher: getRoles,
    params: { search: debouncedSearch },
    pageSize: PAGE_SIZE,
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

  function togglePermission(code: string) {
    setEditPermissions((previous) =>
      previous.includes(code)
        ? previous.filter((item) => item !== code)
        : [...previous, code]
    )
  }

  function toggleMenuPermission(code: string) {
    setEditPermissions((previous) => {
      const has = previous.includes(code)
      if (has) {
        // 取消菜单权限时，同时移除其下所有操作权限
        return previous.filter(
          (item) =>
            item !== code &&
            !operationPermissions.some(
              (operation) =>
                operation.code === item && operation.parent === code
            )
        )
      }
      // 勾选菜单权限时，同时勾选其下所有操作权限
      const childOperations = operationPermissions
        .filter((operation) => operation.parent === code)
        .map((operation) => operation.code)
      return [
        ...previous,
        code,
        ...childOperations.filter((c) => !previous.includes(c)),
      ]
    })
  }

  function isMenuChecked(code: string) {
    return editPermissions.includes(code)
  }

  function isMenuIndeterminate(code: string) {
    const children = operationPermissions.filter(
      (operation) => operation.parent === code
    )
    if (children.length === 0) return false
    const checked = children.filter((operation) =>
      editPermissions.includes(operation.code)
    ).length
    return checked > 0
  }

  function selectAllPermissions() {
    setEditPermissions([
      ...menuPermissions.map((permission) => permission.code),
      ...operationPermissions.map((permission) => permission.code),
    ])
  }

  function clearPermissions() {
    setEditPermissions([])
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

  const hasRoles = list.items.length > 0
  const showEmpty = !list.loading && !hasRoles

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
            {hasPermission("roles.create") && (
              <Button onClick={handleAdd} className="w-full md:w-auto">
                <PlusIcon data-icon="inline-start" />
                新增角色
              </Button>
            )}
          </>
        }
        footer={
          hasRoles ? (
            <TablePagination
              page={list.page}
              totalPages={list.totalPages}
              total={list.total}
              itemLabel="个角色"
              onPageChange={list.setPage}
            />
          ) : null
        }
      >
        {list.error && hasRoles && (
          <InlineError message={list.error} onRetry={list.refresh} />
        )}

        {list.loading && !hasRoles ? (
          <TableSkeletonRow colSpan={5} />
        ) : list.error && !hasRoles ? (
          <ErrorState message={list.error} onRetry={list.refresh} />
        ) : showEmpty ? (
          <EmptyState
            icon={ShieldCheckIcon}
            title={debouncedSearch ? "没有匹配的角色" : "还没有角色"}
            description={
              debouncedSearch
                ? "换个关键词，或清空搜索条件后再试。"
                : "创建角色并分配权限，再把角色授予用户。"
            }
            action={
              debouncedSearch ? (
                <Button variant="outline" onClick={() => setSearch("")}>
                  清空搜索
                </Button>
              ) : hasPermission("roles.create") ? (
                <Button onClick={handleAdd}>
                  <PlusIcon data-icon="inline-start" />
                  新增角色
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="flex flex-col gap-2 md:hidden">
              {list.items.map((role) => (
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
              ))}
            </div>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>角色名称</TableHead>
                    <TableHead className="hidden md:table-cell">描述</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      权限数
                    </TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead className="sticky right-0 bg-card text-right">
                      操作
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.items.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {role.description || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="secondary">
                          {role.permissions.length}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {role.isPreset ? (
                          <Badge variant="outline">
                            <LockIcon />
                            预设
                          </Badge>
                        ) : (
                          <Badge variant="secondary">自定义</Badge>
                        )}
                      </TableCell>
                      <TableCell className="sticky right-0 bg-inherit text-right">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </ListShell>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title={editingRole ? "编辑角色" : "新增角色"}
        description={
          editingRole ? "修改角色信息和权限分配。" : "填写角色信息并分配权限。"
        }
        submitting={editSubmitting}
        className="sm:max-w-lg"
        onSubmit={handleEditSubmit}
      >
        <FieldGroup>
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
        </FieldGroup>

        <FieldSet className="gap-3">
          <FieldLegend variant="label" className="mb-0">
            权限分配
          </FieldLegend>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <FieldDescription>
              勾选菜单权限时，会自动勾选该菜单下的所有操作权限。
            </FieldDescription>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={selectAllPermissions}
              >
                全选
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={clearPermissions}
              >
                清空
              </Button>
            </div>
          </div>

          {permissionsLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              权限加载中…
            </div>
          ) : permissionsError ? (
            <div className="flex flex-col items-start gap-2 rounded-md border p-3 text-sm">
              <span className="text-destructive">{permissionsError}</span>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={loadPermissions}
              >
                重试
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[min(50vh,420px)] pr-3">
              <div className="flex flex-col gap-3">
                {menuPermissions.map((permission) => {
                  const children = operationPermissions.filter(
                    (operation) => operation.parent === permission.code
                  )
                  const checked = isMenuChecked(permission.code)
                  const indeterminate = isMenuIndeterminate(permission.code)

                  return (
                    <div key={permission.code} className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={
                            checked
                              ? true
                              : indeterminate
                                ? "indeterminate"
                                : false
                          }
                          onCheckedChange={() =>
                            toggleMenuPermission(permission.code)
                          }
                        />
                        {permission.name}
                      </label>
                      {children.length > 0 && (checked || indeterminate) && (
                        <div className="ml-6 flex flex-wrap gap-x-4 gap-y-2">
                          {children.map((child) => (
                            <label
                              key={child.code}
                              className="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                              <Checkbox
                                checked={editPermissions.includes(child.code)}
                                onCheckedChange={() =>
                                  togglePermission(child.code)
                                }
                              />
                              {child.name}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
                {menuPermissions.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    暂无可分配的权限
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
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
