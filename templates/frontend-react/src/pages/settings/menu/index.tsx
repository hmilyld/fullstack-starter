import * as React from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
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
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  EyeIcon,
  EyeOffIcon,
  GripVerticalIcon,
  KeyRoundIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"

import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog"
import { ConfirmHideDialog } from "@/components/shared/confirm-hide-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { FormDialog } from "@/components/shared/form-dialog"
import { IconPicker, MenuIcon } from "@/components/shared/icon-picker"
import { InlineError } from "@/components/shared/inline-error"
import { ListShell } from "@/components/shared/list-shell"
import { PageHeader } from "@/components/shared/page-header"
import { RowActions, type RowAction } from "@/components/shared/row-actions"
import { PageFormSkeleton } from "@/components/shared/table-states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
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
import {
  createPermission,
  deletePermission,
  updatePermission,
} from "@/api/permission"
import { useAuth } from "@/lib/auth-context"
import { OPERATION_PRESETS, buildOperationCode } from "@/lib/access-tree"
import { groupSortableId, itemSortableId, type DragData } from "@/lib/menu-tree"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { MenuTreeTable } from "@/pages/settings/menu/MenuTreeTable"
import type {
  MenuConfig,
  MenuGroup,
  MenuItem,
  MenuOperation,
} from "@/types/menu"

const NAVIGATION_REFRESH_EVENT = "navigation-refresh"

/** 内置菜单/分组使用导航目录中的翻译，自定义名称保持后端数据 */
function useMenuLabel() {
  const { t } = useTranslation()
  return React.useCallback(
    (item: { isSystem?: boolean; permissionCode?: string; name: string }) =>
      item.isSystem && item.permissionCode
        ? t(`nav.items.${item.permissionCode}`, { defaultValue: item.name })
        : item.name,
    [t]
  )
}

function useGroupLabel() {
  const { t } = useTranslation()
  return React.useCallback(
    (group: { isSystem?: boolean; id: string; name: string }) =>
      group.isSystem
        ? t(`nav.groups.${group.id}`, { defaultValue: group.name })
        : group.name,
    [t]
  )
}

type DeleteTarget =
  | { type: "group"; id: string; name: string }
  | { type: "item"; id: string; name: string; operationCount: number }
  | { type: "operation"; id: string; name: string }
  | null

function cloneConfig(config: MenuConfig): MenuConfig {
  return {
    version: config.version,
    groups: config.groups.map((group) => ({
      ...group,
      items: group.items.map((item) => ({
        ...item,
        operations: item.operations.map((operation) => ({ ...operation })),
      })),
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

function applyDragEnd(
  current: MenuConfig,
  activeData: DragData,
  overData: DragData
): MenuConfig {
  if (activeData.type === "group" && overData.type === "group") {
    if (activeData.groupId === overData.groupId) return current
    const oldIndex = current.groups.findIndex(
      (group) => group.id === activeData.groupId
    )
    const newIndex = current.groups.findIndex(
      (group) => group.id === overData.groupId
    )
    if (oldIndex < 0 || newIndex < 0) return current
    return normalize({
      ...current,
      groups: arrayMove(current.groups, oldIndex, newIndex),
    })
  }

  if (activeData.type !== "item") return current
  if (overData.type !== "item" && overData.type !== "group-drop") return current

  const targetGroupId = overData.groupId
  const sourceGroup = current.groups.find(
    (group) => group.id === activeData.groupId
  )
  const targetGroup = current.groups.find((group) => group.id === targetGroupId)
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
            (candidate) => candidate.permissionCode === overData.permissionCode
          )
        : sourceGroup.items.length - 1
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return current
    return normalize({
      ...current,
      groups: current.groups.map((group) =>
        group.id === sourceGroup.id
          ? { ...group, items: arrayMove(group.items, oldIndex, newIndex) }
          : group
      ),
    })
  }

  const targetIndex =
    overData.type === "item"
      ? targetGroup.items.findIndex(
          (candidate) => candidate.permissionCode === overData.permissionCode
        )
      : targetGroup.items.length

  return normalize({
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
  })
}

function SortableMenuItem({
  item,
  groupId,
  canReorder,
  canEdit,
  canDelete,
  canMoveUp,
  canMoveDown,
  canCreateOperation,
  canEditOperation,
  canDeleteOperation,
  mutationsDisabled,
  expanded,
  onToggleExpanded,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleHidden,
  onAddOperation,
  onEditOperation,
  onDeleteOperation,
}: {
  item: MenuItem
  groupId: string
  canReorder: boolean
  canEdit: boolean
  canDelete: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  canCreateOperation: boolean
  canEditOperation: boolean
  canDeleteOperation: boolean
  mutationsDisabled: boolean
  expanded: boolean
  onToggleExpanded: (permissionCode: string) => void
  onEdit: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onToggleHidden: (item: MenuItem) => void
  onAddOperation: (item: MenuItem) => void
  onEditOperation: (item: MenuItem, operation: MenuOperation) => void
  onDeleteOperation: (item: MenuItem, operation: MenuOperation) => void
}) {
  const { t } = useTranslation()
  const menuLabel = useMenuLabel()
  const name = menuLabel(item)
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

  const actions: RowAction[] = []
  if (canEdit) {
    actions.push({
      label: item.hidden
        ? t("menuPage.actions.showInSidebar")
        : t("menuPage.actions.hideMenu"),
      icon: item.hidden ? EyeIcon : EyeOffIcon,
      disabled: mutationsDisabled,
      onSelect: () => onToggleHidden(item),
    })
    actions.push({
      label: t("menuPage.actions.edit"),
      icon: PencilIcon,
      disabled: mutationsDisabled,
      onSelect: () => onEdit(item),
    })
  }
  if (canReorder) {
    actions.push(
      {
        label: t("menuPage.actions.up"),
        icon: ChevronUpIcon,
        disabled: !canMoveUp || mutationsDisabled,
        onSelect: onMoveUp,
      },
      {
        label: t("menuPage.actions.down"),
        icon: ChevronDownIcon,
        disabled: !canMoveDown || mutationsDisabled,
        onSelect: onMoveDown,
      }
    )
  }
  if (canDelete && !item.isSystem) {
    actions.push({
      label: t("menuPage.actions.delete"),
      icon: Trash2Icon,
      destructive: true,
      separatorBefore: true,
      disabled: mutationsDisabled,
      onSelect: () => onDelete(item),
    })
  }

  function buildOperationActions(operation: MenuOperation): RowAction[] {
    const result: RowAction[] = []
    if (canEditOperation) {
      result.push({
        label: t("menuPage.actions.edit"),
        icon: PencilIcon,
        disabled: mutationsDisabled,
        onSelect: () => onEditOperation(item, operation),
      })
    }
    if (canDeleteOperation) {
      result.push({
        label: t("menuPage.actions.delete"),
        icon: Trash2Icon,
        destructive: true,
        separatorBefore: true,
        disabled: mutationsDisabled,
        onSelect: () => onDeleteOperation(item, operation),
      })
    }
    return result
  }

  const panelId = `operation-panel-${item.permissionCode}`

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border bg-background",
        isDragging && "relative z-10 opacity-70"
      )}
    >
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {canReorder && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="cursor-grab touch-none"
              aria-label={t("menuPage.aria.dragItem", { name })}
              {...attributes}
              {...listeners}
            >
              <GripVerticalIcon />
            </Button>
          )}
          <MenuIcon name={item.icon} className="size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <p className="truncate text-sm font-medium">{name}</p>
              {item.isSystem && (
                <Badge variant="outline">{t("menuPage.builtIn")}</Badge>
              )}
              {item.hidden && (
                <Badge variant="secondary">{t("menuPage.hidden")}</Badge>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {item.route}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="max-md:h-11 max-md:w-11 max-md:px-0"
            aria-expanded={expanded}
            aria-controls={panelId}
            aria-label={t("menuPage.aria.toggleOperations", {
              action: expanded
                ? t("menuPage.actions.collapse")
                : t("menuPage.actions.expand"),
              name,
            })}
            onClick={() => onToggleExpanded(item.permissionCode)}
          >
            <ChevronRightIcon
              className={cn("transition-transform", expanded && "rotate-90")}
            />
            <span className="hidden md:inline">
              {t("menuPage.operationCount", {
                count: item.operations.length,
              })}
            </span>
          </Button>
          <RowActions
            actions={actions}
            label={t("menuPage.itemActions", { name })}
          />
        </div>
      </div>

      {expanded && (
        <div id={panelId} className="border-t bg-muted/20 px-3 py-2">
          <div className="flex items-center justify-between gap-2 pb-1">
            <p className="text-xs font-medium text-muted-foreground">
              {t("menuPage.operationPermissions")}
            </p>
            {canCreateOperation && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={mutationsDisabled}
                onClick={() => onAddOperation(item)}
              >
                <PlusIcon data-icon="inline-start" />
                {t("menuPage.addOperation")}
              </Button>
            )}
          </div>
          {item.operations.length === 0 ? (
            <p className="px-1 py-2 text-xs text-muted-foreground">
              {t("menuPage.noOperations")}
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {item.operations.map((operation) => (
                <div
                  key={operation.code}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/60"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <KeyRoundIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm">{operation.name}</span>
                    <Badge
                      variant="secondary"
                      className="font-mono text-[10px] max-md:hidden"
                    >
                      {operation.code}
                    </Badge>
                  </div>
                  <RowActions
                    actions={buildOperationActions(operation)}
                    label={t("menuPage.itemActions", {
                      name: operation.name,
                    })}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SortableGroup({
  group,
  canReorder,
  canCreate,
  canEdit,
  canDelete,
  canCreateOperation,
  canEditOperation,
  canDeleteOperation,
  mutationsDisabled,
  canMoveUp,
  canMoveDown,
  expanded,
  onToggleExpanded,
  onCreateItem,
  onEditGroup,
  onDeleteGroup,
  onEditItem,
  onDeleteItem,
  onMoveUp,
  onMoveDown,
  onMoveItem,
  onToggleHidden,
  onAddOperation,
  onEditOperation,
  onDeleteOperation,
}: {
  group: MenuGroup
  canReorder: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canCreateOperation: boolean
  canEditOperation: boolean
  canDeleteOperation: boolean
  mutationsDisabled: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  expanded: Set<string>
  onToggleExpanded: (permissionCode: string) => void
  onCreateItem: (groupId: string) => void
  onEditGroup: (group: MenuGroup) => void
  onDeleteGroup: (group: MenuGroup) => void
  onEditItem: (item: MenuItem) => void
  onDeleteItem: (item: MenuItem) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onMoveItem: (
    groupId: string,
    permissionCode: string,
    direction: -1 | 1
  ) => void
  onToggleHidden: (item: MenuItem) => void
  onAddOperation: (item: MenuItem) => void
  onEditOperation: (item: MenuItem, operation: MenuOperation) => void
  onDeleteOperation: (item: MenuItem, operation: MenuOperation) => void
}) {
  const { t } = useTranslation()
  const groupLabel = useGroupLabel()
  const name = groupLabel(group)
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

  const actions: RowAction[] = []
  if (canEdit) {
    actions.push({
      label: t("menuPage.actions.editGroup"),
      icon: PencilIcon,
      disabled: mutationsDisabled,
      onSelect: () => onEditGroup(group),
    })
  }
  if (canReorder) {
    actions.push(
      {
        label: t("menuPage.actions.moveUpGroup"),
        icon: ChevronUpIcon,
        disabled: !canMoveUp || mutationsDisabled,
        onSelect: onMoveUp,
      },
      {
        label: t("menuPage.actions.moveDownGroup"),
        icon: ChevronDownIcon,
        disabled: !canMoveDown || mutationsDisabled,
        onSelect: onMoveDown,
      }
    )
  }
  if (canDelete && !group.isSystem) {
    actions.push({
      label: t("menuPage.actions.deleteGroup"),
      icon: Trash2Icon,
      destructive: true,
      separatorBefore: true,
      disabled: mutationsDisabled,
      onSelect: () => onDeleteGroup(group),
    })
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
                aria-label={t("menuPage.aria.dragGroup", { name })}
                {...attributes}
                {...listeners}
              >
                <GripVerticalIcon />
              </Button>
            )}
            <CardTitle className="truncate">{name}</CardTitle>
            {group.isSystem && (
              <Badge variant="outline">{t("menuPage.builtIn")}</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {canCreate && (
              <Button
                variant="ghost"
                size="sm"
                className="max-md:w-8 max-md:px-0"
                aria-label={t("menuPage.actions.addMenu")}
                disabled={mutationsDisabled}
                onClick={() => onCreateItem(group.id)}
              >
                <PlusIcon data-icon="inline-start" />
                <span className="hidden md:inline">
                  {t("menuPage.actions.addMenu")}
                </span>
              </Button>
            )}
            <RowActions
              actions={actions}
              label={t("menuPage.groupActions", { name })}
            />
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
          {group.items.map((item, itemIndex) => (
            <SortableMenuItem
              key={item.permissionCode}
              item={item}
              groupId={group.id}
              canReorder={canReorder}
              canEdit={canEdit}
              canDelete={canDelete}
              canMoveUp={itemIndex > 0}
              canMoveDown={itemIndex < group.items.length - 1}
              canCreateOperation={canCreateOperation}
              canEditOperation={canEditOperation}
              canDeleteOperation={canDeleteOperation}
              mutationsDisabled={mutationsDisabled}
              expanded={expanded.has(item.permissionCode)}
              onToggleExpanded={onToggleExpanded}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
              onMoveUp={() => onMoveItem(group.id, item.permissionCode, -1)}
              onMoveDown={() => onMoveItem(group.id, item.permissionCode, 1)}
              onToggleHidden={onToggleHidden}
              onAddOperation={onAddOperation}
              onEditOperation={onEditOperation}
              onDeleteOperation={onDeleteOperation}
            />
          ))}
        </SortableContext>
        {group.items.length === 0 && (
          <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            {t("menuPage.emptyMenu")}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function MenuPage() {
  const { t } = useTranslation()
  const menuLabel = useMenuLabel()
  const groupLabel = useGroupLabel()
  const { hasPermission } = useAuth()
  const isCompact = useIsMobile()
  const [config, setConfig] = React.useState<MenuConfig | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const savingRef = React.useRef(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set())
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(
    new Set()
  )
  const [search, setSearch] = React.useState("")

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
    hidden: false,
  })

  const [operationOpen, setOperationOpen] = React.useState(false)
  const [operationMenu, setOperationMenu] = React.useState<MenuItem | null>(
    null
  )
  const [editingOperation, setEditingOperation] =
    React.useState<MenuOperation | null>(null)
  const [operationForm, setOperationForm] = React.useState({
    name: "",
    verb: "view",
    code: "",
    custom: false,
  })

  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget>(null)
  const [deleteLoading, setDeleteLoading] = React.useState(false)
  const [hideConfirmTarget, setHideConfirmTarget] =
    React.useState<MenuItem | null>(null)
  const [hideConfirmLoading, setHideConfirmLoading] = React.useState(false)
  const [pendingItemSubmit, setPendingItemSubmit] = React.useState(false)

  const canReorder = hasPermission("menus.reorder")
  const canCreate = hasPermission("menus.create")
  const canEdit = hasPermission("menus.edit")
  const canDelete = hasPermission("menus.delete")
  const canViewOverview = hasPermission("permissions")
  const canCreateOperation = hasPermission("permissions.create")
  const canEditOperation = hasPermission("permissions.edit")
  const canDeleteOperation = hasPermission("permissions.delete")
  const reorderEnabled = canReorder && !search.trim() && !saving

  const load = React.useCallback(async (): Promise<boolean> => {
    setLoading(true)
    setError(null)
    const response = await getMenuConfig()
    if (response.code === 0) {
      setConfig(cloneConfig(response.data))
      setLoading(false)
      return true
    }
    setError(response.message || t("menuPage.loadFailed"))
    setLoading(false)
    return false
  }, [t])

  React.useEffect(() => {
    void load()
  }, [load])

  const visibleGroups = React.useMemo(() => {
    if (!config) return []
    const query = search.trim().toLowerCase()
    if (!query) return config.groups
    return config.groups
      .map((group) => {
        const groupMatch = group.name.toLowerCase().includes(query)
        const items = group.items.filter((item) => {
          const itemMatch =
            item.name.toLowerCase().includes(query) ||
            item.permissionCode.toLowerCase().includes(query) ||
            item.route.toLowerCase().includes(query)
          const operationMatch = item.operations.some(
            (operation) =>
              operation.name.toLowerCase().includes(query) ||
              operation.code.toLowerCase().includes(query)
          )
          return itemMatch || operationMatch
        })
        if (!groupMatch && items.length === 0) return null
        return { ...group, items: groupMatch ? group.items : items }
      })
      .filter((group): group is MenuGroup => group !== null)
  }, [config, search])

  React.useEffect(() => {
    const query = search.trim().toLowerCase()
    if (!query || !config) return
    const next = new Set<string>()
    for (const group of config.groups) {
      for (const item of group.items) {
        if (
          item.operations.some(
            (operation) =>
              operation.name.toLowerCase().includes(query) ||
              operation.code.toLowerCase().includes(query)
          )
        ) {
          next.add(item.permissionCode)
        }
      }
    }
    setExpanded(next)
  }, [config, search])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
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

  function toggleExpanded(permissionCode: string) {
    setExpanded((previous) => {
      const next = new Set(previous)
      if (next.has(permissionCode)) next.delete(permissionCode)
      else next.add(permissionCode)
      return next
    })
  }

  function toggleGroup(groupId: string) {
    setCollapsedGroups((previous) => {
      const next = new Set(previous)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  async function persistLayout(next: MenuConfig) {
    if (!canReorder || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    try {
      const response = await saveMenuLayout({
        version: next.version,
        groups: next.groups.map((group) => ({
          id: group.id,
          sortOrder: group.sortOrder,
          items: group.items.map((item) => ({
            permissionCode: item.permissionCode,
            sortOrder: item.sortOrder,
          })),
        })),
      })
      if (response.code !== 0) {
        appToast.error(response.message || t("menuPage.toasts.saveFailed"))
        await load()
        return
      }
      setConfig((current) =>
        current ? { ...current, version: response.data.version } : current
      )
      setError(null)
      window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  function moveGroup(groupId: string, direction: -1 | 1) {
    if (!config || !reorderEnabled || savingRef.current) return
    const index = config.groups.findIndex((group) => group.id === groupId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= config.groups.length) return
    const next = normalize({
      ...config,
      groups: arrayMove(config.groups, index, target),
    })
    setConfig(next)
    void persistLayout(next)
  }

  function moveItem(
    groupId: string,
    permissionCode: string,
    direction: -1 | 1
  ) {
    if (!config || !reorderEnabled || savingRef.current) return
    const group = config.groups.find((item) => item.id === groupId)
    if (!group) return
    const index = group.items.findIndex(
      (item) => item.permissionCode === permissionCode
    )
    const target = index + direction
    if (index < 0 || target < 0 || target >= group.items.length) return
    const next = normalize({
      ...config,
      groups: config.groups.map((item) =>
        item.id === groupId
          ? { ...item, items: arrayMove(item.items, index, target) }
          : item
      ),
    })
    setConfig(next)
    void persistLayout(next)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || !config || !reorderEnabled || savingRef.current) return
    const activeData = active.data.current as DragData | undefined
    const overData = over.data.current as DragData | undefined
    if (!activeData || !overData) return
    const next = applyDragEnd(config, activeData, overData)
    if (next === config) return
    setConfig(next)
    void persistLayout(next)
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
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setSubmitting(true)
    try {
      const response = editingGroup
        ? await updateMenuGroup(editingGroup.id, groupName)
        : await createMenuGroup(groupName)
      if (response.code !== 0) {
        appToast.error(response.message || t("menuPage.toasts.operationFailed"))
        return
      }
      setGroupOpen(false)
      await load()
      window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
      appToast.success(
        editingGroup
          ? t("menuPage.toasts.groupUpdated")
          : t("menuPage.toasts.groupCreated")
      )
    } finally {
      setSubmitting(false)
      savingRef.current = false
      setSaving(false)
    }
  }

  function openCreateItem(groupId: string) {
    setEditingItem(null)
    setItemForm({
      permissionCode: "",
      name: "",
      groupId,
      route: "",
      icon: "circle",
      hidden: false,
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
      hidden: item.hidden,
    })
    setItemOpen(true)
  }

  async function submitItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (savingRef.current) return
    if (
      editingItem &&
      (editingItem.permissionCode === "menus" ||
        editingItem.permissionCode === "settings") &&
      itemForm.hidden &&
      !editingItem.hidden
    ) {
      setHideConfirmTarget(editingItem)
      setPendingItemSubmit(true)
      return
    }
    await submitItemNow()
  }

  async function submitItemNow() {
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setSubmitting(true)
    try {
      const response = editingItem
        ? await updateMenuItem(editingItem.permissionCode, {
            name: itemForm.name,
            groupId: itemForm.groupId,
            route: itemForm.route,
            icon: itemForm.icon,
            hidden: itemForm.hidden,
          })
        : await createMenuItem(itemForm)
      if (response.code !== 0) {
        appToast.error(response.message || t("menuPage.toasts.operationFailed"))
        return
      }
      setItemOpen(false)
      await load()
      window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
      appToast.success(
        editingItem
          ? t("menuPage.toasts.menuUpdated")
          : t("menuPage.toasts.menuCreated")
      )
    } finally {
      setSubmitting(false)
      savingRef.current = false
      setSaving(false)
    }
  }

  async function applyHidden(item: MenuItem, hidden: boolean) {
    if (savingRef.current) return false
    savingRef.current = true
    setSaving(true)
    try {
      const response = await updateMenuItem(item.permissionCode, { hidden })
      if (response.code !== 0) {
        appToast.error(response.message || t("menuPage.toasts.operationFailed"))
        return false
      }
      if (!(await load())) {
        appToast.error(t("menuPage.toasts.hiddenSavedReloadFailed"))
        return false
      }
      window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
      appToast.success(
        hidden
          ? t("menuPage.toasts.menuHidden")
          : t("menuPage.toasts.menuShown")
      )
      return true
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  async function toggleHidden(item: MenuItem) {
    if (item.hidden) {
      await applyHidden(item, false)
      return
    }
    if (item.permissionCode === "menus" || item.permissionCode === "settings") {
      setPendingItemSubmit(false)
      setHideConfirmTarget(item)
      return
    }
    await applyHidden(item, true)
  }

  async function confirmHide() {
    if (!hideConfirmTarget || savingRef.current) return
    setHideConfirmLoading(true)
    const ok = await applyHidden(hideConfirmTarget, true)
    setHideConfirmLoading(false)
    if (ok) setHideConfirmTarget(null)
  }

  async function handleHideConfirm() {
    if (pendingItemSubmit) {
      setPendingItemSubmit(false)
      setHideConfirmTarget(null)
      await submitItemNow()
      return
    }
    await confirmHide()
  }

  function openCreateOperation(item: MenuItem) {
    setOperationMenu(item)
    setEditingOperation(null)
    setOperationForm({
      name: "",
      verb: "view",
      code: buildOperationCode(item.permissionCode, "view"),
      custom: false,
    })
    setOperationOpen(true)
  }

  function openEditOperation(item: MenuItem, operation: MenuOperation) {
    setOperationMenu(item)
    setEditingOperation(operation)
    setOperationForm({
      name: operation.name,
      verb: "",
      code: operation.code,
      custom: true,
    })
    setOperationOpen(true)
  }

  function handleOperationVerbChange(verb: string) {
    setOperationForm((form) => ({
      ...form,
      verb,
      code:
        form.custom || !operationMenu
          ? form.code
          : buildOperationCode(operationMenu.permissionCode, verb),
    }))
  }

  function handleOperationCustomChange(custom: boolean) {
    setOperationForm((form) => ({
      ...form,
      custom,
      code:
        custom || !operationMenu
          ? form.code
          : buildOperationCode(
              operationMenu.permissionCode,
              form.verb || "view"
            ),
    }))
  }

  async function submitOperation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!operationMenu || savingRef.current) return
    if (!operationForm.name.trim()) {
      appToast.error(t("menuPage.dialogs.operation.nameRequired"))
      return
    }
    const code = operationForm.code.trim()
    if (!editingOperation && !code) {
      appToast.error(t("menuPage.dialogs.operation.codeRequired"))
      return
    }

    savingRef.current = true
    setSaving(true)
    setSubmitting(true)
    try {
      const response = editingOperation
        ? await updatePermission(editingOperation.code, {
            name: operationForm.name,
            parent: operationMenu.permissionCode,
          })
        : await createPermission({
            code,
            name: operationForm.name,
            type: "operation",
            parent: operationMenu.permissionCode,
          })
      if (response.code !== 0) {
        appToast.error(response.message || t("menuPage.toasts.operationFailed"))
        return
      }
      appToast.success(
        editingOperation
          ? t("menuPage.toasts.operationUpdated")
          : t("menuPage.toasts.operationCreated")
      )
      setOperationOpen(false)
      await load()
    } finally {
      setSubmitting(false)
      savingRef.current = false
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || savingRef.current) return
    const target = deleteTarget
    savingRef.current = true
    setSaving(true)
    setDeleteLoading(true)
    try {
      const response =
        target.type === "group"
          ? await deleteMenuGroup(target.id)
          : target.type === "item"
            ? await deleteMenuItem(target.id)
            : await deletePermission(target.id)
      if (response.code !== 0) {
        appToast.error(response.message || t("menuPage.toasts.deleteFailed"))
        return
      }
      setDeleteTarget(null)
      await load()
      if (target.type !== "operation") {
        window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
      }
      appToast.success(t("menuPage.toasts.deleteSuccess"))
    } finally {
      setDeleteLoading(false)
      savingRef.current = false
      setSaving(false)
    }
  }

  const deleteDescription =
    deleteTarget?.type === "item"
      ? deleteTarget.operationCount > 0
        ? t("menuPage.delete.itemWithOperations", {
            count: deleteTarget.operationCount,
          })
        : t("menuPage.delete.item")
      : deleteTarget?.type === "operation"
        ? t("menuPage.delete.operation")
        : deleteTarget?.type === "group"
          ? t("menuPage.delete.group")
          : undefined

  if (loading) {
    return (
      <div className="flex flex-col gap-(--page-gap)">
        <PageHeader
          title={t("menuPage.title")}
          description={t("menuPage.description")}
        />
        <PageFormSkeleton />
      </div>
    )
  }

  if (!config) {
    return (
      <div className="flex flex-col gap-(--page-gap)">
        <PageHeader
          title={t("menuPage.title")}
          description={t("menuPage.description")}
        />
        <ErrorState
          message={error || t("menuPage.loadFailed")}
          onRetry={load}
        />
      </div>
    )
  }

  const totalMenus = config.groups.reduce(
    (sum, group) => sum + group.items.length,
    0
  )
  const totalOperations = config.groups.reduce(
    (sum, group) =>
      sum +
      group.items.reduce(
        (itemSum, item) => itemSum + item.operations.length,
        0
      ),
    0
  )

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <PageHeader
        title={t("menuPage.title")}
        description={t("menuPage.description")}
      />

      <ListShell
        description={t("menuPage.listDescription", {
          groups: config.groups.length,
          menus: totalMenus,
          operations: totalOperations,
        })}
        actions={
          <>
            <InputGroup className="w-full md:w-64">
              <InputGroupInput
                name="q"
                autoComplete="off"
                spellCheck={false}
                placeholder={t("menuPage.searchPlaceholder")}
                aria-label={t("menuPage.searchAria")}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
            </InputGroup>
            {saving && (
              <span className="text-xs text-muted-foreground">
                {t("menuPage.saving")}
              </span>
            )}
            {canViewOverview && (
              <Button asChild variant="outline" className="w-full md:w-auto">
                <Link to="/settings/permission">
                  <KeyRoundIcon data-icon="inline-start" />
                  {t("menuPage.overview")}
                </Link>
              </Button>
            )}
            {canCreate && (
              <Button
                variant="outline"
                disabled={saving}
                className="w-full md:w-auto"
                onClick={openCreateGroup}
              >
                <PlusIcon data-icon="inline-start" />
                {t("menuPage.addGroup")}
              </Button>
            )}
            {search.trim() && (
              <span className="text-xs text-muted-foreground">
                {t("menuPage.dragPaused")}
              </span>
            )}
          </>
        }
      >
        {error && <InlineError message={error} onRetry={load} />}

        {config.groups.length === 0 ? (
          <EmptyState
            title={t("menuPage.emptyGroupTitle")}
            description={t("menuPage.emptyGroupDescription")}
            action={
              canCreate ? (
                <Button onClick={openCreateGroup}>
                  <PlusIcon data-icon="inline-start" />
                  {t("menuPage.addGroup")}
                </Button>
              ) : null
            }
          />
        ) : visibleGroups.length === 0 ? (
          <EmptyState
            title={t("menuPage.emptySearchTitle")}
            description={t("menuPage.emptySearchDescription")}
            action={
              <Button variant="outline" onClick={() => setSearch("")}>
                {t("menuPage.clearSearch")}
              </Button>
            }
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragEnd={handleDragEnd}
          >
            {isCompact ? (
              <SortableContext
                items={visibleGroups.map((group) => groupSortableId(group.id))}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-4">
                  {visibleGroups.map((group, groupIndex) => (
                    <SortableGroup
                      key={group.id}
                      group={group}
                      canReorder={reorderEnabled}
                      canCreate={canCreate}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      canCreateOperation={canCreateOperation}
                      canEditOperation={canEditOperation}
                      canDeleteOperation={canDeleteOperation}
                      mutationsDisabled={saving}
                      canMoveUp={groupIndex > 0}
                      canMoveDown={groupIndex < visibleGroups.length - 1}
                      expanded={expanded}
                      onToggleExpanded={toggleExpanded}
                      onCreateItem={openCreateItem}
                      onEditGroup={openEditGroup}
                      onDeleteGroup={(target) =>
                        setDeleteTarget({
                          type: "group",
                          id: target.id,
                          name: target.name,
                        })
                      }
                      onMoveUp={() => moveGroup(group.id, -1)}
                      onMoveDown={() => moveGroup(group.id, 1)}
                      onMoveItem={moveItem}
                      onEditItem={openEditItem}
                      onDeleteItem={(item) =>
                        setDeleteTarget({
                          type: "item",
                          id: item.permissionCode,
                          name: item.name,
                          operationCount: item.operations.length,
                        })
                      }
                      onToggleHidden={toggleHidden}
                      onAddOperation={openCreateOperation}
                      onEditOperation={openEditOperation}
                      onDeleteOperation={(_item, operation) =>
                        setDeleteTarget({
                          type: "operation",
                          id: operation.code,
                          name: operation.name,
                        })
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            ) : (
              <MenuTreeTable
                groups={visibleGroups}
                expanded={expanded}
                collapsedGroups={
                  search.trim() ? new Set<string>() : collapsedGroups
                }
                canReorder={reorderEnabled}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                canCreateOperation={canCreateOperation}
                canEditOperation={canEditOperation}
                canDeleteOperation={canDeleteOperation}
                mutationsDisabled={saving}
                onToggleGroup={toggleGroup}
                onToggleExpanded={toggleExpanded}
                onCreateItem={openCreateItem}
                onEditGroup={openEditGroup}
                onDeleteGroup={(group) =>
                  setDeleteTarget({
                    type: "group",
                    id: group.id,
                    name: group.name,
                  })
                }
                onEditItem={openEditItem}
                onDeleteItem={(item) =>
                  setDeleteTarget({
                    type: "item",
                    id: item.permissionCode,
                    name: item.name,
                    operationCount: item.operations.length,
                  })
                }
                onMoveGroup={moveGroup}
                onMoveItem={moveItem}
                onToggleHidden={toggleHidden}
                onAddOperation={openCreateOperation}
                onEditOperation={openEditOperation}
                onDeleteOperation={(_item, operation) =>
                  setDeleteTarget({
                    type: "operation",
                    id: operation.code,
                    name: operation.name,
                  })
                }
              />
            )}
          </DndContext>
        )}
      </ListShell>

      <FormDialog
        open={groupOpen}
        onOpenChange={setGroupOpen}
        title={
          editingGroup
            ? t("menuPage.dialogs.group.editTitle")
            : t("menuPage.dialogs.group.addTitle")
        }
        description={t("menuPage.dialogs.group.description")}
        submitting={submitting}
        onSubmit={submitGroup}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="group-name">
              {t("menuPage.dialogs.group.name")}
            </FieldLabel>
            <Input
              name="group-name"
              autoComplete="off"
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
        title={
          editingItem
            ? t("menuPage.dialogs.item.editTitle")
            : t("menuPage.dialogs.item.addTitle")
        }
        description={t("menuPage.dialogs.item.description")}
        submitting={submitting}
        onSubmit={submitItem}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="item-code">
              {t("menuPage.dialogs.item.code")}
            </FieldLabel>
            <Input
              name="item-code"
              autoComplete="off"
              spellCheck={false}
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
              title={t("menuPage.dialogs.item.codePattern")}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="item-name">
              {t("menuPage.dialogs.item.name")}
            </FieldLabel>
            <Input
              name="item-name"
              autoComplete="off"
              id="item-name"
              value={itemForm.name}
              onChange={(event) =>
                setItemForm((form) => ({ ...form, name: event.target.value }))
              }
              required
            />
          </Field>
          <Field>
            <FieldLabel>{t("menuPage.dialogs.item.group")}</FieldLabel>
            <Select
              value={itemForm.groupId}
              onValueChange={(value) =>
                setItemForm((form) => ({ ...form, groupId: value }))
              }
            >
              <SelectTrigger
                className="w-full"
                aria-label={t("menuPage.dialogs.item.group")}
              >
                <SelectValue
                  placeholder={t("menuPage.dialogs.item.selectGroup")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {config.groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {groupLabel(group)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="item-route">
              {t("menuPage.dialogs.item.route")}
            </FieldLabel>
            <Input
              name="item-route"
              autoComplete="off"
              spellCheck={false}
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
            <FieldLabel>{t("menuPage.dialogs.item.icon")}</FieldLabel>
            <IconPicker
              value={itemForm.icon}
              onChange={(icon) => setItemForm((form) => ({ ...form, icon }))}
            />
          </Field>
          <Field orientation="horizontal">
            <div className="flex flex-1 flex-col gap-1">
              <FieldLabel htmlFor="item-visible">
                {t("menuPage.dialogs.item.visible")}
              </FieldLabel>
              <FieldDescription>
                {editingItem?.permissionCode === "menus" ||
                editingItem?.permissionCode === "settings"
                  ? t("menuPage.dialogs.item.criticalHint")
                  : t("menuPage.dialogs.item.visibleHint")}
              </FieldDescription>
            </div>
            <Switch
              id="item-visible"
              checked={!itemForm.hidden}
              onCheckedChange={(visible) =>
                setItemForm((form) => ({ ...form, hidden: !visible }))
              }
            />
          </Field>
        </FieldGroup>
      </FormDialog>

      <FormDialog
        open={operationOpen}
        onOpenChange={setOperationOpen}
        title={
          editingOperation
            ? t("menuPage.dialogs.operation.editTitle")
            : t("menuPage.dialogs.operation.addTitle")
        }
        description={
          operationMenu
            ? t("menuPage.dialogs.operation.description", {
                name: menuLabel(operationMenu),
                code: operationMenu.permissionCode,
              })
            : undefined
        }
        submitting={submitting}
        onSubmit={submitOperation}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="operation-name">
              {t("menuPage.dialogs.operation.name")}
            </FieldLabel>
            <Input
              name="operation-name"
              autoComplete="off"
              id="operation-name"
              placeholder={t("menuPage.dialogs.operation.namePlaceholder")}
              value={operationForm.name}
              onChange={(event) =>
                setOperationForm((form) => ({
                  ...form,
                  name: event.target.value,
                }))
              }
              required
            />
          </Field>
          {!editingOperation && (
            <Field>
              <FieldLabel>{t("menuPage.dialogs.operation.preset")}</FieldLabel>
              <Select
                value={operationForm.verb}
                onValueChange={handleOperationVerbChange}
              >
                <SelectTrigger
                  className="w-full"
                  aria-label={t("menuPage.dialogs.operation.preset")}
                >
                  <SelectValue
                    placeholder={t(
                      "menuPage.dialogs.operation.presetPlaceholder"
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {OPERATION_PRESETS.map((preset) => (
                      <SelectItem key={preset.verb} value={preset.verb}>
                        {t(`menuPage.verbs.${preset.verb}`)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field orientation="horizontal">
            <div className="flex flex-1 flex-col gap-1">
              <FieldLabel htmlFor="operation-custom">
                {t("menuPage.dialogs.operation.custom")}
              </FieldLabel>
              <FieldDescription>
                {t("menuPage.dialogs.operation.customHint")}
              </FieldDescription>
            </div>
            <Switch
              id="operation-custom"
              checked={operationForm.custom}
              disabled={!!editingOperation}
              onCheckedChange={handleOperationCustomChange}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="operation-code">
              {t("menuPage.dialogs.operation.code")}
            </FieldLabel>
            <Input
              name="operation-code"
              autoComplete="off"
              spellCheck={false}
              id="operation-code"
              value={operationForm.code}
              onChange={(event) =>
                setOperationForm((form) => ({
                  ...form,
                  code: event.target.value,
                }))
              }
              disabled={!operationForm.custom || !!editingOperation}
              required
              pattern="^[a-z0-9_.-]+$"
              title={t("menuPage.dialogs.operation.codePattern")}
            />
            <FieldDescription>
              {t("menuPage.dialogs.operation.codeHint")}
            </FieldDescription>
          </Field>
        </FieldGroup>
      </FormDialog>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        targetName={deleteTarget?.name || ""}
        description={deleteDescription}
        loading={deleteLoading}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onConfirm={confirmDelete}
      />

      <ConfirmHideDialog
        open={!!hideConfirmTarget}
        targetName={hideConfirmTarget ? menuLabel(hideConfirmTarget) : ""}
        loading={hideConfirmLoading}
        onOpenChange={(open) => {
          if (!open) {
            setHideConfirmTarget(null)
            setPendingItemSubmit(false)
          }
        }}
        onConfirm={handleHideConfirm}
      />
    </div>
  )
}
