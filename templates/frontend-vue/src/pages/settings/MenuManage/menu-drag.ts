export type MenuDragData =
  | { type: "group"; groupId: string; index: number }
  | {
      type: "item"
      groupId: string
      index: number
      permissionCode: string
    }
  | { type: "group-drop"; groupId: string; index: number }

export const groupSortableId = (groupId: string) => `group:${groupId}`
export const itemSortableId = (groupId: string, permissionCode: string) =>
  `item:${groupId}:${permissionCode}`
