export type DragData =
  | { type: "group"; groupId: string }
  | { type: "item"; groupId: string; permissionCode: string }
  | { type: "group-drop"; groupId: string }

export const groupSortableId = (groupId: string) => `group:${groupId}`

export const itemSortableId = (groupId: string, permissionCode: string) =>
  `item:${groupId}:${permissionCode}`
