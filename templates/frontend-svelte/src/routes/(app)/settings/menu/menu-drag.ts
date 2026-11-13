import type { MenuConfig } from "#lib/types/menu.js"

export type MenuDragData =
  | { type: "group"; groupId: string; index: number }
  | {
      type: "item"
      groupId: string
      index: number
      permissionCode: string
    }
  | { type: "group-drop"; groupId: string; index: number }

export type MenuDragSource = {
  type: "group" | "item"
  initialIndex: number
  index: number
  groupId: string
  permissionCode?: string
  initialGroup?: string
  group?: string
}

export type MenuDragTarget = {
  type: "group" | "item" | "group-drop"
  groupId: string
  index: number
}

export const groupSortableId = (groupId: string) => `group:${groupId}`
export const itemSortableId = (groupId: string, permissionCode: string) =>
  `item:${groupId}:${permissionCode}`

export function cloneMenuConfig(config: MenuConfig): MenuConfig {
  return {
    version: config.version,
    groups: config.groups.map((group) => ({
      ...group,
      items: group.items.map((item) => ({ ...item })),
    })),
  }
}

export function normalizeMenuConfig(config: MenuConfig): MenuConfig {
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

export function arrayMove<T>(items: T[], from: number, to: number) {
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export function moveMenuGroup(
  config: MenuConfig,
  groupId: string,
  direction: -1 | 1
) {
  const next = cloneMenuConfig(config)
  const index = next.groups.findIndex((group) => group.id === groupId)
  const target = index + direction
  if (index < 0 || target < 0 || target >= next.groups.length) {
    return normalizeMenuConfig(next)
  }
  return normalizeMenuConfig({
    ...next,
    groups: arrayMove(next.groups, index, target),
  })
}

export function moveMenuItem(
  config: MenuConfig,
  groupId: string,
  permissionCode: string,
  direction: -1 | 1
) {
  const next = cloneMenuConfig(config)
  const group = next.groups.find((item) => item.id === groupId)
  if (!group) return normalizeMenuConfig(next)

  const index = group.items.findIndex(
    (item) => item.permissionCode === permissionCode
  )
  const target = index + direction
  if (index < 0 || target < 0 || target >= group.items.length) {
    return normalizeMenuConfig(next)
  }

  return normalizeMenuConfig({
    ...next,
    groups: next.groups.map((item) =>
      item.id === groupId
        ? { ...item, items: arrayMove(item.items, index, target) }
        : item
    ),
  })
}

/**
 * 应用一次拖拽结果。
 * 同组使用 sortable 提供的 index；跨组使用目标项/分组 drop zone 的 index。
 * 空分组或拖到分组内容底部时，使用 items.length 追加。
 */
export function applyMenuDrag(
  config: MenuConfig,
  source: MenuDragSource,
  target?: MenuDragTarget
): MenuConfig {
  const next = cloneMenuConfig(config)
  const sourceGroupId = source.initialGroup ?? source.groupId
  const targetGroupId = source.group ?? target?.groupId ?? sourceGroupId
  const nextGroupIndex =
    targetGroupId !== sourceGroupId && target
      ? target.type === "group"
        ? Number.MAX_SAFE_INTEGER
        : target.index
      : source.index

  if (source.type === "group") {
    if (source.initialIndex === source.index) {
      return normalizeMenuConfig(next)
    }
    return normalizeMenuConfig({
      ...next,
      groups: arrayMove(next.groups, source.initialIndex, source.index),
    })
  }

  if (source.type !== "item" || !source.permissionCode) {
    return normalizeMenuConfig(next)
  }

  const sourceGroup = next.groups.find((group) => group.id === sourceGroupId)
  const targetGroup = next.groups.find((group) => group.id === targetGroupId)
  if (!sourceGroup || !targetGroup) return normalizeMenuConfig(next)

  const item = sourceGroup.items.find(
    (candidate) => candidate.permissionCode === source.permissionCode
  )
  if (!item) return normalizeMenuConfig(next)

  if (sourceGroup.id === targetGroup.id) {
    if (source.initialIndex === nextGroupIndex) {
      return normalizeMenuConfig(next)
    }
    return normalizeMenuConfig({
      ...next,
      groups: next.groups.map((group) =>
        group.id === sourceGroup.id
          ? {
              ...group,
              items: arrayMove(
                group.items,
                source.initialIndex,
                nextGroupIndex
              ),
            }
          : group
      ),
    })
  }

  return normalizeMenuConfig({
    ...next,
    groups: next.groups.map((group) => {
      if (group.id === sourceGroup.id) {
        return {
          ...group,
          items: group.items.filter(
            (candidate) => candidate.permissionCode !== source.permissionCode
          ),
        }
      }
      if (group.id === targetGroup.id) {
        const items = [...group.items]
        const targetIndex = nextGroupIndex < 0 ? items.length : nextGroupIndex
        items.splice(targetIndex, 0, item)
        return { ...group, items }
      }
      return group
    }),
  })
}
