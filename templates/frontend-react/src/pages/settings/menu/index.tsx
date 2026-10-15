import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/shared/loading-button"
import { PageFormSkeleton } from "@/components/shared/table-states"
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { IconPicker, MenuIcon } from "@/components/shared/icon-picker"
import {
  GripVerticalIcon,
  PencilIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { appToast } from "@/lib/toast"
import {
  createMenuGroup,
  createMenuItem,
  deleteMenuGroup,
  deleteMenuItem,
  getMenuConfig,
  saveMenuLayout,
  updateMenuGroup,
  updateMenuItem,
} from "@/api/menu"
import type { MenuConfig, MenuGroup, MenuItem } from "@/types/menu"

type DragState =
  | { type: "group"; groupId: string }
  | { type: "item"; groupId: string; permissionCode: string }
  | null

type DeleteTarget =
  | { type: "group"; id: string; name: string }
  | { type: "item"; id: string; name: string }
  | null

function cloneConfig(config: MenuConfig): MenuConfig {
  return {
    version: config.version,
    groups: config.groups.map((group) => ({
      ...group,
      items: group.items.map((item) => ({ ...item })),
    })),
  }
}

function normalize(config: MenuConfig): MenuConfig {
  return {
    ...config,
    groups: config.groups.map((group, groupIndex) => ({
      ...group,
      sortOrder: groupIndex + 1,
      items: group.items.map((item, itemIndex) => ({
        ...item,
        groupId: group.id,
        sortOrder: itemIndex + 1,
      })),
    })),
  }
}

export function MenuPage() {
  const { hasPermission } = useAuth()
  const [config, setConfig] = React.useState<MenuConfig | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [dragState, setDragState] = React.useState<DragState>(null)
  const [groupOpen, setGroupOpen] = React.useState(false)
  const [editingGroup, setEditingGroup] = React.useState<MenuGroup | null>(null)
  const [groupName, setGroupName] = React.useState("")
  const [itemOpen, setItemOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<MenuItem | null>(null)
  const [itemForm, setItemForm] = React.useState({
    permissionCode: "",
    name: "",
    groupId: "",
    route: "",
    icon: "circle",
  })
  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget>(null)
  const [deleteLoading, setDeleteLoading] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    const response = await getMenuConfig()
    if (response.code === 0) setConfig(cloneConfig(response.data))
    else appToast.error(response.message || "加载菜单失败")
    setLoading(false)
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  function updateDraft(updater: (current: MenuConfig) => MenuConfig) {
    setConfig((current) => (current ? normalize(updater(cloneConfig(current))) : current))
  }

  function dropGroup(targetId: string) {
    if (!dragState || dragState.type !== "group" || dragState.groupId === targetId) return
    updateDraft((current) => {
      const sourceIndex = current.groups.findIndex((group) => group.id === dragState.groupId)
      const targetIndex = current.groups.findIndex((group) => group.id === targetId)
      if (sourceIndex < 0 || targetIndex < 0) return current
      const [group] = current.groups.splice(sourceIndex, 1)
      current.groups.splice(targetIndex, 0, group)
      return current
    })
    setDragState(null)
  }

  function dropItem(targetGroupId: string, targetCode?: string) {
    if (!dragState || dragState.type !== "item") return
    updateDraft((current) => {
      const sourceGroup = current.groups.find((group) => group.id === dragState.groupId)
      const targetGroup = current.groups.find((group) => group.id === targetGroupId)
      if (!sourceGroup || !targetGroup) return current
      const sourceIndex = sourceGroup.items.findIndex(
        (item) => item.permissionCode === dragState.permissionCode
      )
      if (sourceIndex < 0) return current
      const [item] = sourceGroup.items.splice(sourceIndex, 1)
      const targetIndex = targetCode
        ? targetGroup.items.findIndex((candidate) => candidate.permissionCode === targetCode)
        : targetGroup.items.length
      targetGroup.items.splice(targetIndex < 0 ? targetGroup.items.length : targetIndex, 0, item)
      return current
    })
    setDragState(null)
  }

  function handleGroupDrop(groupId: string) {
    if (dragState?.type === "item") dropItem(groupId)
    else dropGroup(groupId)
  }

  async function handleSave() {
    if (!config) return
    setSaving(true)
    const response = await saveMenuLayout({
      version: config.version,
      groups: config.groups.map((group) => ({
        id: group.id,
        sortOrder: group.sortOrder,
        items: group.items.map((item) => ({
          permissionCode: item.permissionCode,
          sortOrder: item.sortOrder,
        })),
      })),
    })
    setSaving(false)
    if (response.code !== 0) {
      appToast.error(response.message || "保存失败")
      return
    }
    setConfig((current) => (current ? { ...current, version: response.data.version } : current))
    window.dispatchEvent(new Event("navigation-refresh"))
    appToast.success("菜单顺序已保存")
  }

  function openCreateGroup() {
    setEditingGroup(null)
    setGroupName("")
    setGroupOpen(true)
  }

  function openEditGroup(group: MenuGroup) {
    setEditingGroup(group)
    setGroupName(group.name)
    setGroupOpen(true)
  }

  async function submitGroup(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    const response = editingGroup
      ? await updateMenuGroup(editingGroup.id, groupName)
      : await createMenuGroup(groupName)
    setSubmitting(false)
    if (response.code !== 0) {
      appToast.error(response.message || "操作失败")
      return
    }
    setGroupOpen(false)
    await load()
    window.dispatchEvent(new Event("navigation-refresh"))
    appToast.success(editingGroup ? "分组已更新" : "分组已创建")
  }

  function openCreateItem(groupId: string) {
    setEditingItem(null)
    setItemForm({ permissionCode: "", name: "", groupId, route: "", icon: "circle" })
    setItemOpen(true)
  }

  function openEditItem(item: MenuItem) {
    setEditingItem(item)
    setItemForm({
      permissionCode: item.permissionCode,
      name: item.name,
      groupId: item.groupId,
      route: item.route,
      icon: item.icon,
    })
    setItemOpen(true)
  }

  async function submitItem(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    const response = editingItem
      ? await updateMenuItem(editingItem.permissionCode, {
          name: itemForm.name,
          groupId: itemForm.groupId,
          route: itemForm.route,
          icon: itemForm.icon,
        })
      : await createMenuItem(itemForm)
    setSubmitting(false)
    if (response.code !== 0) {
      appToast.error(response.message || "操作失败")
      return
    }
    setItemOpen(false)
    await load()
    window.dispatchEvent(new Event("navigation-refresh"))
    appToast.success(editingItem ? "菜单已更新" : "菜单已创建")
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    const response =
      deleteTarget.type === "group"
        ? await deleteMenuGroup(deleteTarget.id)
        : await deleteMenuItem(deleteTarget.id)
    setDeleteLoading(false)
    if (response.code !== 0) {
      appToast.error(response.message || "删除失败")
      return
    }
    setDeleteTarget(null)
    await load()
    window.dispatchEvent(new Event("navigation-refresh"))
    appToast.success("删除成功")
  }

  if (loading || !config) return <PageFormSkeleton />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">菜单管理</h1>
          <p className="text-muted-foreground">维护系统分组、菜单入口与显示顺序。</p>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission("menus.create") && (
            <Button variant="outline" onClick={openCreateGroup}>
              <PlusIcon />
              新增分组
            </Button>
          )}
          {hasPermission("menus.reorder") && (
            <LoadingButton loading={saving} onClick={handleSave}>
              <SaveIcon />
              保存排序
            </LoadingButton>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {config.groups.map((group) => (
          <Card
            key={group.id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleGroupDrop(group.id)}
          >
            <CardHeader className="border-b">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {hasPermission("menus.reorder") && (
                    <button
                      type="button"
                      draggable
                      className="cursor-grab text-muted-foreground"
                      onDragStart={() => setDragState({ type: "group", groupId: group.id })}
                      onDragEnd={() => setDragState(null)}
                    >
                      <GripVerticalIcon className="size-4" />
                    </button>
                  )}
                  <CardTitle className="truncate">{group.name}</CardTitle>
                  {group.isSystem && (
                    <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      内置
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {hasPermission("menus.create") && (
                    <Button variant="ghost" size="sm" onClick={() => openCreateItem(group.id)}>
                      <PlusIcon />
                      新增菜单
                    </Button>
                  )}
                  {hasPermission("menus.edit") && (
                    <Button variant="ghost" size="icon-sm" onClick={() => openEditGroup(group)}>
                      <PencilIcon />
                    </Button>
                  )}
                  {hasPermission("menus.delete") && !group.isSystem && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setDeleteTarget({ type: "group", id: group.id, name: group.name })
                      }
                    >
                      <Trash2Icon />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 p-2">
              {group.items.map((item) => (
                <div
                  key={item.permissionCode}
                  draggable={hasPermission("menus.reorder")}
                  onDragStart={(event) => {
                    event.stopPropagation()
                    setDragState({
                      type: "item",
                      groupId: group.id,
                      permissionCode: item.permissionCode,
                    })
                  }}
                  onDragEnd={() => setDragState(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.stopPropagation()
                    dropItem(group.id, item.permissionCode)
                  }}
                  className="flex items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-muted/60"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <GripVerticalIcon className="size-4 shrink-0 cursor-grab text-muted-foreground" />
                    <MenuIcon name={item.icon} className="size-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.route}</p>
                    </div>
                    {item.isSystem && (
                      <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        内置
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {hasPermission("menus.edit") && (
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditItem(item)}>
                        <PencilIcon />
                      </Button>
                    )}
                    {hasPermission("menus.delete") && !item.isSystem && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          setDeleteTarget({
                            type: "item",
                            id: item.permissionCode,
                            name: item.name,
                          })
                        }
                      >
                        <Trash2Icon />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {group.items.length === 0 && (
                <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                  暂无菜单
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
        <DialogContent>
          <form onSubmit={submitGroup}>
            <DialogHeader>
              <DialogTitle>{editingGroup ? "编辑分组" : "新增分组"}</DialogTitle>
              <DialogDescription>分组名称仅用于侧边栏展示。</DialogDescription>
            </DialogHeader>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel>分组名称</FieldLabel>
                <Input
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  required
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGroupOpen(false)}>
                取消
              </Button>
              <LoadingButton loading={submitting} type="submit">
                保存
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={itemOpen} onOpenChange={setItemOpen}>
        <DialogContent>
          <form onSubmit={submitItem}>
            <DialogHeader>
              <DialogTitle>{editingItem ? "编辑菜单" : "新增菜单"}</DialogTitle>
              <DialogDescription>菜单路由需要由前端页面提供。</DialogDescription>
            </DialogHeader>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel>权限编码</FieldLabel>
                <Input
                  value={itemForm.permissionCode}
                  onChange={(event) =>
                    setItemForm((current) => ({
                      ...current,
                      permissionCode: event.target.value,
                    }))
                  }
                  disabled={!!editingItem}
                  required
                />
              </Field>
              <Field>
                <FieldLabel>菜单名称</FieldLabel>
                <Input
                  value={itemForm.name}
                  onChange={(event) =>
                    setItemForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
              </Field>
              <Field>
                <FieldLabel>所属分组</FieldLabel>
                <select
                  className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                  value={itemForm.groupId}
                  onChange={(event) =>
                    setItemForm((current) => ({ ...current, groupId: event.target.value }))
                  }
                >
                  {config.groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel>路由</FieldLabel>
                <Input
                  value={itemForm.route}
                  placeholder="/settings/example"
                  onChange={(event) =>
                    setItemForm((current) => ({ ...current, route: event.target.value }))
                  }
                  required
                />
              </Field>
              <Field>
                <FieldLabel>图标</FieldLabel>
                <IconPicker
                  value={itemForm.icon}
                  onChange={(icon) => setItemForm((current) => ({ ...current, icon }))}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setItemOpen(false)}>
                取消
              </Button>
              <LoadingButton loading={submitting} type="submit">
                保存
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        targetName={deleteTarget?.name || ""}
        description={
          deleteTarget?.type === "group"
            ? "仅空分组可以删除。"
            : "对应菜单权限和角色授权也会被删除。"
        }
        loading={deleteLoading}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
