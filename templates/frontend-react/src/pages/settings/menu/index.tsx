import * as React from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  GripVerticalIcon,
  PencilIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react"

import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { FormDialog } from "@/components/shared/form-dialog"
import { LoadingButton } from "@/components/shared/loading-button"
import { PageHeader } from "@/components/shared/page-header"
import { PageFormSkeleton } from "@/components/shared/table-states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { IconPicker, MenuIcon } from "@/components/shared/icon-picker"
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
  createMenuGroup,
  createMenuItem,
  deleteMenuGroup,
  deleteMenuItem,
  getMenuConfig,
  saveMenuLayout,
  updateMenuGroup,
  updateMenuItem,
} from "@/api/menu"
import { useAuth } from "@/lib/auth-context"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { MenuConfig, MenuGroup, MenuItem } from "@/types/menu"

const NAVIGATION_REFRESH_EVENT = "navigation-refresh"

type DragData =
  | { type: "group"; groupId: string }
  | { type: "item"; groupId: string; permissionCode: string }
  | { type: "group-drop"; groupId: string }

type DeleteTarget =
  | { type: "group"; id: string; name: string }
  | { type: "item"; id: string; name: string }
  | null

const groupSortableId = (groupId: string) => `group:${groupId}`
const itemSortableId = (groupId: string, permissionCode: string) =>
  `item:${groupId}:${permissionCode}`

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

function SortableMenuItem({
  item,
  groupId,
  canReorder,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  item: MenuItem
  groupId: string
  canReorder: boolean
  canEdit: boolean
  canDelete: boolean
  onEdit: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: itemSortableId(groupId, item.permissionCode),
    data: {
      type: "item",
      groupId,
      permissionCode: item.permissionCode,
    } satisfies DragData,
    disabled: !canReorder,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-muted/60",
        isDragging && "relative z-10 opacity-70"
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {canReorder && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="cursor-grab touch-none"
            aria-label={`拖动 ${item.name} 排序`}
            {...attributes}
            {...listeners}
          >
            <GripVerticalIcon />
          </Button>
        )}
        <MenuIcon name={item.icon} className="size-4 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{item.name}</p>
          <p className="truncate text-xs text-muted-foreground">{item.route}</p>
        </div>
        {item.isSystem && <Badge variant="outline">内置</Badge>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {canEdit && (
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(item)}>
            <PencilIcon />
            <span className="sr-only">编辑 {item.name}</span>
          </Button>
        )}
        {canDelete && !item.isSystem && (
          <Button variant="ghost" size="icon-sm" onClick={() => onDelete(item)}>
            <Trash2Icon />
            <span className="sr-only">删除 {item.name}</span>
          </Button>
        )}
      </div>
    </div>
  )
}

function SortableGroup({
  group,
  canReorder,
  canCreate,
  canEdit,
  canDelete,
  onCreateItem,
  onEditGroup,
  onDeleteGroup,
  onEditItem,
  onDeleteItem,
}: {
  group: MenuGroup
  canReorder: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  onCreateItem: (groupId: string) => void
  onEditGroup: (group: MenuGroup) => void
  onDeleteGroup: (group: MenuGroup) => void
  onEditItem: (item: MenuItem) => void
  onDeleteItem: (item: MenuItem) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: groupSortableId(group.id),
    data: { type: "group", groupId: group.id } satisfies DragData,
    disabled: !canReorder,
  })
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `group-drop:${group.id}`,
    data: { type: "group-drop", groupId: group.id } satisfies DragData,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "relative z-10 opacity-70")}
    >
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {canReorder && (
              <Button
                variant="ghost"
                size="icon-xs"
                className="cursor-grab touch-none"
                aria-label={`拖动 ${group.name} 分组排序`}
                {...attributes}
                {...listeners}
              >
                <GripVerticalIcon />
              </Button>
            )}
            <CardTitle className="truncate">{group.name}</CardTitle>
            {group.isSystem && <Badge variant="outline">内置</Badge>}
          </div>
          <div className="flex items-center gap-1">
            {canCreate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCreateItem(group.id)}
              >
                <PlusIcon data-icon="inline-start" />
                新增菜单
              </Button>
            )}
            {canEdit && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onEditGroup(group)}
              >
                <PencilIcon />
                <span className="sr-only">编辑分组 {group.name}</span>
              </Button>
            )}
            {canDelete && !group.isSystem && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onDeleteGroup(group)}
              >
                <Trash2Icon />
                <span className="sr-only">删除分组 {group.name}</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent
        ref={setDropRef}
        className={cn(
          "flex flex-col gap-1 p-2 transition-colors",
          isOver && "bg-muted/40"
        )}
      >
        <SortableContext
          items={group.items.map((item) =>
            itemSortableId(group.id, item.permissionCode)
          )}
          strategy={verticalListSortingStrategy}
        >
          {group.items.map((item) => (
            <SortableMenuItem
              key={item.permissionCode}
              item={item}
              groupId={group.id}
              canReorder={canReorder}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
            />
          ))}
        </SortableContext>
        {group.items.length === 0 && (
          <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            暂无菜单
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function MenuPage() {
  const { hasPermission } = useAuth()
  const [config, setConfig] = React.useState<MenuConfig | null>(null)
  const [savedConfig, setSavedConfig] = React.useState<MenuConfig | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

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

  const canReorder = hasPermission("menus.reorder")
  const canCreate = hasPermission("menus.create")
  const canEdit = hasPermission("menus.edit")
  const canDelete = hasPermission("menus.delete")

  const load = React.useCallback(async () => {
    setLoading(true)
    const response = await getMenuConfig()
    if (response.code === 0) {
      setConfig(cloneConfig(response.data))
      setSavedConfig(cloneConfig(response.data))
    } else {
      appToast.error(response.message || "加载菜单失败")
    }
    setLoading(false)
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  const dirty =
    config !== null &&
    savedConfig !== null &&
    JSON.stringify(config) !== JSON.stringify(savedConfig)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const collisionDetection = React.useCallback<CollisionDetection>((args) => {
    const activeType = args.active.data.current?.type
    const droppableContainers = args.droppableContainers.filter((container) => {
      const type = container.data.current?.type
      return activeType === "group"
        ? type === "group"
        : type === "item" || type === "group-drop"
    })
    return closestCenter({ ...args, droppableContainers })
  }, [])

  function updateDraft(updater: (current: MenuConfig) => MenuConfig) {
    setConfig((current) =>
      current ? normalize(updater(cloneConfig(current))) : current
    )
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current as DragData | undefined
    const overData = over.data.current as DragData | undefined
    if (!activeData || !overData) return

    if (activeData.type === "group" && overData.type === "group") {
      if (activeData.groupId === overData.groupId) return
      updateDraft((current) => {
        const oldIndex = current.groups.findIndex(
          (group) => group.id === activeData.groupId
        )
        const newIndex = current.groups.findIndex(
          (group) => group.id === overData.groupId
        )
        if (oldIndex < 0 || newIndex < 0) return current
        return {
          ...current,
          groups: arrayMove(current.groups, oldIndex, newIndex),
        }
      })
      return
    }

    if (activeData.type !== "item") return
    if (overData.type !== "item" && overData.type !== "group-drop") return

    const targetGroupId = overData.groupId

    updateDraft((current) => {
      const sourceGroup = current.groups.find(
        (group) => group.id === activeData.groupId
      )
      const targetGroup = current.groups.find(
        (group) => group.id === targetGroupId
      )
      if (!sourceGroup || !targetGroup) return current

      const item = sourceGroup.items.find(
        (candidate) => candidate.permissionCode === activeData.permissionCode
      )
      if (!item) return current

      if (sourceGroup.id === targetGroup.id) {
        const oldIndex = sourceGroup.items.findIndex(
          (candidate) => candidate.permissionCode === activeData.permissionCode
        )
        const newIndex =
          overData.type === "item"
            ? sourceGroup.items.findIndex(
                (candidate) =>
                  candidate.permissionCode === overData.permissionCode
              )
            : sourceGroup.items.length - 1
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
          return current
        }
        return {
          ...current,
          groups: current.groups.map((group) =>
            group.id === sourceGroup.id
              ? { ...group, items: arrayMove(group.items, oldIndex, newIndex) }
              : group
          ),
        }
      }

      const targetIndex =
        overData.type === "item"
          ? targetGroup.items.findIndex(
              (candidate) =>
                candidate.permissionCode === overData.permissionCode
            )
          : targetGroup.items.length

      return {
        ...current,
        groups: current.groups.map((group) => {
          if (group.id === sourceGroup.id) {
            return {
              ...group,
              items: group.items.filter(
                (candidate) =>
                  candidate.permissionCode !== activeData.permissionCode
              ),
            }
          }
          if (group.id === targetGroup.id) {
            const items = [...group.items]
            items.splice(targetIndex < 0 ? items.length : targetIndex, 0, item)
            return { ...group, items }
          }
          return group
        }),
      }
    })
  }

  async function handleSave() {
    if (!config || !dirty) return
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
    const next = cloneConfig(config)
    next.version = response.data.version
    setConfig(next)
    setSavedConfig(next)
    window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
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

  async function submitGroup(event: React.FormEvent<HTMLFormElement>) {
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
    window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
    appToast.success(editingGroup ? "分组已更新" : "分组已创建")
  }

  function openCreateItem(groupId: string) {
    setEditingItem(null)
    setItemForm({
      permissionCode: "",
      name: "",
      groupId,
      route: "",
      icon: "circle",
    })
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

  async function submitItem(event: React.FormEvent<HTMLFormElement>) {
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
    window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
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
    window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
    appToast.success("删除成功")
  }

  if (loading || !config) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="菜单管理"
          description="维护系统分组、菜单入口与显示顺序。"
        />
        <PageFormSkeleton />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="菜单管理"
        description="维护系统分组、菜单入口与显示顺序。"
        actions={
          <>
            {dirty && <Badge variant="warning">有未保存的排序修改</Badge>}
            {canCreate && (
              <Button variant="outline" onClick={openCreateGroup}>
                <PlusIcon data-icon="inline-start" />
                新增分组
              </Button>
            )}
            {canReorder && (
              <LoadingButton
                loading={saving}
                disabled={!dirty}
                onClick={handleSave}
              >
                <SaveIcon data-icon="inline-start" />
                保存排序
              </LoadingButton>
            )}
          </>
        }
      />

      {config.groups.length === 0 ? (
        <EmptyState
          title="还没有菜单分组"
          description="先创建一个分组，再把菜单入口放进去。"
          action={
            canCreate ? (
              <Button onClick={openCreateGroup}>
                <PlusIcon data-icon="inline-start" />
                新增分组
              </Button>
            ) : null
          }
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={config.groups.map((group) => groupSortableId(group.id))}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-4">
              {config.groups.map((group) => (
                <SortableGroup
                  key={group.id}
                  group={group}
                  canReorder={canReorder}
                  canCreate={canCreate}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onCreateItem={openCreateItem}
                  onEditGroup={openEditGroup}
                  onDeleteGroup={(target) =>
                    setDeleteTarget({
                      type: "group",
                      id: target.id,
                      name: target.name,
                    })
                  }
                  onEditItem={openEditItem}
                  onDeleteItem={(item) =>
                    setDeleteTarget({
                      type: "item",
                      id: item.permissionCode,
                      name: item.name,
                    })
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <FormDialog
        open={groupOpen}
        onOpenChange={setGroupOpen}
        title={editingGroup ? "编辑分组" : "新增分组"}
        description="分组名称仅用于侧边栏展示。"
        submitting={submitting}
        onSubmit={submitGroup}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="group-name">分组名称</FieldLabel>
            <Input
              id="group-name"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              required
            />
          </Field>
        </FieldGroup>
      </FormDialog>

      <FormDialog
        open={itemOpen}
        onOpenChange={setItemOpen}
        title={editingItem ? "编辑菜单" : "新增菜单"}
        description="菜单路由需要由前端页面提供。"
        submitting={submitting}
        onSubmit={submitItem}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="item-code">权限编码</FieldLabel>
            <Input
              id="item-code"
              value={itemForm.permissionCode}
              onChange={(event) =>
                setItemForm((form) => ({
                  ...form,
                  permissionCode: event.target.value,
                }))
              }
              disabled={!!editingItem}
              required
              pattern="^[a-z0-9_.-]+$"
              title="只能包含小写字母、数字、点、下划线和连字符"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="item-name">菜单名称</FieldLabel>
            <Input
              id="item-name"
              value={itemForm.name}
              onChange={(event) =>
                setItemForm((form) => ({ ...form, name: event.target.value }))
              }
              required
            />
          </Field>
          <Field>
            <FieldLabel>所属分组</FieldLabel>
            <Select
              value={itemForm.groupId}
              onValueChange={(value) =>
                setItemForm((form) => ({ ...form, groupId: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择分组" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {config.groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="item-route">路由</FieldLabel>
            <Input
              id="item-route"
              value={itemForm.route}
              placeholder="/settings/example"
              onChange={(event) =>
                setItemForm((form) => ({ ...form, route: event.target.value }))
              }
              required
            />
          </Field>
          <Field>
            <FieldLabel>图标</FieldLabel>
            <IconPicker
              value={itemForm.icon}
              onChange={(icon) => setItemForm((form) => ({ ...form, icon }))}
            />
          </Field>
        </FieldGroup>
      </FormDialog>

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
