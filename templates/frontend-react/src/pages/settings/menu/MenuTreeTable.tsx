import * as React from "react"
import { useTranslation } from "react-i18next"
import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
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
  Trash2Icon,
} from "lucide-react"

import { MenuIcon } from "@/components/shared/icon-picker"
import { RowActions, type RowAction } from "@/components/shared/row-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { groupSortableId, itemSortableId, type DragData } from "@/lib/menu-tree"
import { cn } from "@/lib/utils"
import type { MenuGroup, MenuItem, MenuOperation } from "@/types/menu"

type MenuTreeTableProps = {
  groups: MenuGroup[]
  expanded: Set<string>
  collapsedGroups: Set<string>
  canReorder: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canCreateOperation: boolean
  canEditOperation: boolean
  canDeleteOperation: boolean
  mutationsDisabled: boolean
  onToggleGroup: (groupId: string) => void
  onToggleExpanded: (permissionCode: string) => void
  onCreateItem: (groupId: string) => void
  onEditGroup: (group: MenuGroup) => void
  onDeleteGroup: (group: MenuGroup) => void
  onEditItem: (item: MenuItem) => void
  onDeleteItem: (item: MenuItem) => void
  onMoveGroup: (groupId: string, direction: -1 | 1) => void
  onMoveItem: (
    groupId: string,
    permissionCode: string,
    direction: -1 | 1
  ) => void
  onToggleHidden: (item: MenuItem) => void
  onAddOperation: (item: MenuItem) => void
  onEditOperation: (item: MenuItem, operation: MenuOperation) => void
  onDeleteOperation: (item: MenuItem, operation: MenuOperation) => void
}

function GroupRow({
  group,
  collapsed,
  canReorder,
  canCreate,
  canEdit,
  canDelete,
  mutationsDisabled,
  canMoveUp,
  canMoveDown,
  onToggleGroup,
  onCreateItem,
  onEditGroup,
  onDeleteGroup,
  onMoveGroup,
}: {
  group: MenuGroup
  collapsed: boolean
  canReorder: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  mutationsDisabled: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onToggleGroup: (groupId: string) => void
  onCreateItem: (groupId: string) => void
  onEditGroup: (group: MenuGroup) => void
  onDeleteGroup: (group: MenuGroup) => void
  onMoveGroup: (groupId: string, direction: -1 | 1) => void
}) {
  const { t } = useTranslation()
  const name = group.isSystem
    ? t(`nav.groups.${group.id}`, { defaultValue: group.name })
    : group.name
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
  if (canReorder) {
    actions.push(
      {
        label: t("menuPage.actions.moveUpGroup"),
        icon: ChevronUpIcon,
        disabled: !canMoveUp || mutationsDisabled,
        onSelect: () => onMoveGroup(group.id, -1),
      },
      {
        label: t("menuPage.actions.moveDownGroup"),
        icon: ChevronDownIcon,
        disabled: !canMoveDown || mutationsDisabled,
        onSelect: () => onMoveGroup(group.id, 1),
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
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b bg-muted/40 transition-colors hover:bg-muted/60",
        isDragging && "relative z-10 opacity-80",
        isOver && "bg-muted/70"
      )}
    >
      <TableCell className="p-2">
        <div ref={setDropRef} className="flex min-w-0 items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-expanded={!collapsed}
            aria-label={t("menuPage.aria.toggleGroup", {
              action: collapsed
                ? t("menuPage.actions.expand")
                : t("menuPage.actions.collapse"),
              name,
            })}
            onClick={() => onToggleGroup(group.id)}
          >
            <ChevronRightIcon
              className={cn("transition-transform", !collapsed && "rotate-90")}
            />
          </Button>
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
          <span className="truncate text-sm font-medium">{name}</span>
          {group.isSystem && (
            <Badge variant="outline">{t("menuPage.builtIn")}</Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {t("menuPage.itemCount", { count: group.items.length })}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{t("menuPage.groupType")}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">—</TableCell>
      <TableCell className="hidden text-muted-foreground lg:table-cell">
        —
      </TableCell>
      <TableCell className="sticky right-0 bg-inherit text-right">
        <div className="flex items-center justify-end gap-1">
          {canCreate && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("menuPage.aria.addMenuUnder", { name })}
              disabled={mutationsDisabled}
              onClick={() => onCreateItem(group.id)}
            >
              <PlusIcon />
            </Button>
          )}
          {canEdit && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("menuPage.aria.editGroup", { name })}
              disabled={mutationsDisabled}
              onClick={() => onEditGroup(group)}
            >
              <PencilIcon />
            </Button>
          )}
          <RowActions
            actions={actions}
            label={t("menuPage.groupActions", { name })}
          />
        </div>
      </TableCell>
    </tr>
  )
}

function MenuRow({
  item,
  groupId,
  expanded,
  canReorder,
  canEdit,
  canDelete,
  canCreateOperation,
  mutationsDisabled,
  canMoveUp,
  canMoveDown,
  onToggleExpanded,
  onEdit,
  onDelete,
  onMoveItem,
  onToggleHidden,
  onAddOperation,
}: {
  item: MenuItem
  groupId: string
  expanded: boolean
  canReorder: boolean
  canEdit: boolean
  canDelete: boolean
  canCreateOperation: boolean
  mutationsDisabled: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onToggleExpanded: (permissionCode: string) => void
  onEdit: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
  onMoveItem: (
    groupId: string,
    permissionCode: string,
    direction: -1 | 1
  ) => void
  onToggleHidden: (item: MenuItem) => void
  onAddOperation: (item: MenuItem) => void
}) {
  const { t } = useTranslation()
  const name = item.isSystem
    ? t(`nav.items.${item.permissionCode}`, { defaultValue: item.name })
    : item.name
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
  }
  if (canReorder) {
    actions.push(
      {
        label: t("menuPage.actions.up"),
        icon: ChevronUpIcon,
        disabled: !canMoveUp || mutationsDisabled,
        onSelect: () => onMoveItem(groupId, item.permissionCode, -1),
      },
      {
        label: t("menuPage.actions.down"),
        icon: ChevronDownIcon,
        disabled: !canMoveDown || mutationsDisabled,
        onSelect: () => onMoveItem(groupId, item.permissionCode, 1),
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

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b transition-colors hover:bg-muted/50",
        isDragging && "relative z-10 opacity-80"
      )}
    >
      <TableCell className="p-2">
        <div className="ml-4 flex min-w-0 items-center gap-1.5 border-l border-border/70 pl-3">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-expanded={expanded}
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
          </Button>
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
          <div className="flex min-w-0 flex-col">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-sm font-medium">{name}</span>
              {item.isSystem && (
                <Badge variant="outline">{t("menuPage.builtIn")}</Badge>
              )}
              {item.hidden && (
                <Badge variant="secondary" className="lg:hidden">
                  {t("menuPage.hidden")}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {t("menuPage.operationCount", {
                  count: item.operations.length,
                })}
              </span>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge>{t("menuPage.menuType")}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm">{item.route}</span>
          <span className="truncate font-mono text-[11px] text-muted-foreground">
            {item.permissionCode}
          </span>
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs",
            item.hidden ? "text-warning" : "text-muted-foreground"
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              item.hidden ? "bg-warning" : "bg-muted-foreground"
            )}
          />
          {item.hidden ? t("menuPage.hidden") : t("menuPage.visible")}
        </span>
      </TableCell>
      <TableCell className="sticky right-0 bg-inherit text-right">
        <div className="flex items-center justify-end gap-1">
          {canCreateOperation && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("menuPage.aria.addOperation", { name })}
              disabled={mutationsDisabled}
              onClick={() => onAddOperation(item)}
            >
              <PlusIcon />
            </Button>
          )}
          {canEdit && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("menuPage.aria.editItem", { name })}
              disabled={mutationsDisabled}
              onClick={() => onEdit(item)}
            >
              <PencilIcon />
            </Button>
          )}
          <RowActions
            actions={actions}
            label={t("menuPage.itemActions", { name })}
          />
        </div>
      </TableCell>
    </tr>
  )
}

function OperationRow({
  item,
  operation,
  canEdit,
  canDelete,
  mutationsDisabled,
  onEdit,
  onDelete,
}: {
  item: MenuItem
  operation: MenuOperation
  canEdit: boolean
  canDelete: boolean
  mutationsDisabled: boolean
  onEdit: (item: MenuItem, operation: MenuOperation) => void
  onDelete: (item: MenuItem, operation: MenuOperation) => void
}) {
  const { t } = useTranslation()
  return (
    <tr className="border-b bg-muted/10 last:border-0 hover:bg-muted/20">
      <TableCell className="p-2">
        <div className="ml-10 flex min-w-0 items-center gap-2 border-l border-border/60 pl-3">
          <KeyRoundIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm">{operation.name}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">{t("menuPage.operationType")}</Badge>
      </TableCell>
      <TableCell>
        <span className="truncate font-mono text-xs">{operation.code}</span>
      </TableCell>
      <TableCell className="hidden text-muted-foreground lg:table-cell">
        —
      </TableCell>
      <TableCell className="sticky right-0 bg-inherit text-right">
        <div className="flex items-center justify-end gap-1">
          {canEdit && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("menuPage.aria.editOperation", {
                name: operation.name,
              })}
              disabled={mutationsDisabled}
              onClick={() => onEdit(item, operation)}
            >
              <PencilIcon />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("menuPage.aria.deleteOperation", {
                name: operation.name,
              })}
              disabled={mutationsDisabled}
              onClick={() => onDelete(item, operation)}
            >
              <Trash2Icon />
            </Button>
          )}
        </div>
      </TableCell>
    </tr>
  )
}

export function MenuTreeTable({
  groups,
  expanded,
  collapsedGroups,
  canReorder,
  canCreate,
  canEdit,
  canDelete,
  canCreateOperation,
  canEditOperation,
  canDeleteOperation,
  mutationsDisabled,
  onToggleGroup,
  onToggleExpanded,
  onCreateItem,
  onEditGroup,
  onDeleteGroup,
  onEditItem,
  onDeleteItem,
  onMoveGroup,
  onMoveItem,
  onToggleHidden,
  onAddOperation,
  onEditOperation,
  onDeleteOperation,
}: MenuTreeTableProps) {
  const { t } = useTranslation()
  return (
    <Table className="min-w-[600px] table-fixed">
      <TableHeader>
        <TableRow className="bg-muted/50 hover:bg-muted/50">
          <TableHead className="w-[35%]">
            {t("menuPage.columns.name")}
          </TableHead>
          <TableHead className="w-[10%]">
            {t("menuPage.columns.type")}
          </TableHead>
          <TableHead className="w-[27%]">
            {t("menuPage.columns.routeOrCode")}
          </TableHead>
          <TableHead className="hidden w-[12%] lg:table-cell">
            {t("menuPage.columns.marker")}
          </TableHead>
          <TableHead className="sticky right-0 w-[16%] bg-muted/50 text-right">
            {t("menuPage.columns.actions")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <SortableContext
          items={groups.map((group) => groupSortableId(group.id))}
          strategy={verticalListSortingStrategy}
        >
          {groups.map((group, groupIndex) => {
            const collapsed = collapsedGroups.has(group.id)
            return (
              <React.Fragment key={group.id}>
                <GroupRow
                  group={group}
                  collapsed={collapsed}
                  canReorder={canReorder}
                  canCreate={canCreate}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  mutationsDisabled={mutationsDisabled}
                  canMoveUp={groupIndex > 0}
                  canMoveDown={groupIndex < groups.length - 1}
                  onToggleGroup={onToggleGroup}
                  onCreateItem={onCreateItem}
                  onEditGroup={onEditGroup}
                  onDeleteGroup={onDeleteGroup}
                  onMoveGroup={onMoveGroup}
                />
                {!collapsed && (
                  <SortableContext
                    items={group.items.map((item) =>
                      itemSortableId(group.id, item.permissionCode)
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    {group.items.map((item, itemIndex) => (
                      <React.Fragment key={item.permissionCode}>
                        <MenuRow
                          item={item}
                          groupId={group.id}
                          expanded={expanded.has(item.permissionCode)}
                          canReorder={canReorder}
                          canEdit={canEdit}
                          canDelete={canDelete}
                          canCreateOperation={canCreateOperation}
                          mutationsDisabled={mutationsDisabled}
                          canMoveUp={itemIndex > 0}
                          canMoveDown={itemIndex < group.items.length - 1}
                          onToggleExpanded={onToggleExpanded}
                          onEdit={onEditItem}
                          onDelete={onDeleteItem}
                          onMoveItem={onMoveItem}
                          onToggleHidden={onToggleHidden}
                          onAddOperation={onAddOperation}
                        />
                        {expanded.has(item.permissionCode) &&
                          item.operations.map((operation) => (
                            <OperationRow
                              key={operation.code}
                              item={item}
                              operation={operation}
                              canEdit={canEditOperation}
                              canDelete={canDeleteOperation}
                              mutationsDisabled={mutationsDisabled}
                              onEdit={onEditOperation}
                              onDelete={onDeleteOperation}
                            />
                          ))}
                      </React.Fragment>
                    ))}
                  </SortableContext>
                )}
              </React.Fragment>
            )
          })}
        </SortableContext>
      </TableBody>
    </Table>
  )
}
