import { describe, expect, it } from "vitest"
import type { MenuConfig } from "@/types/menu"
import { applyMenuDrag, moveMenuGroup, moveMenuItem } from "./menu-drag"

function makeConfig(): MenuConfig {
  return {
    version: 1,
    groups: [
      {
        id: "navigation",
        name: "导航",
        sortOrder: 1,
        isSystem: true,
        items: [
          {
            permissionCode: "dashboard",
            name: "仪表盘",
            groupId: "navigation",
            route: "/dashboard",
            icon: "layout-dashboard",
            sortOrder: 1,
            isSystem: true,
          },
        ],
      },
      {
        id: "management",
        name: "管理",
        sortOrder: 2,
        isSystem: true,
        items: [
          {
            permissionCode: "users",
            name: "用户管理",
            groupId: "management",
            route: "/settings/user",
            icon: "users",
            sortOrder: 1,
            isSystem: true,
          },
          {
            permissionCode: "roles",
            name: "角色管理",
            groupId: "management",
            route: "/settings/role",
            icon: "shield-check",
            sortOrder: 2,
            isSystem: true,
          },
        ],
      },
      {
        id: "empty",
        name: "空分组",
        sortOrder: 3,
        isSystem: false,
        items: [],
      },
    ],
  }
}

describe("menu-drag", () => {
  it("moves a group and normalizes sort order", () => {
    const next = moveMenuGroup(makeConfig(), "empty", -1)

    expect(next.groups.map((group) => group.id)).toEqual([
      "navigation",
      "empty",
      "management",
    ])
    expect(next.groups.map((group) => group.sortOrder)).toEqual([1, 2, 3])
  })

  it("moves an item within a group", () => {
    const next = moveMenuItem(makeConfig(), "management", "users", 1)

    expect(next.groups[1].items.map((item) => item.permissionCode)).toEqual([
      "roles",
      "users",
    ])
    expect(next.groups[1].items.map((item) => item.sortOrder)).toEqual([1, 2])
  })

  it("applies a same-group drag result", () => {
    const next = applyMenuDrag(
      makeConfig(),
      {
        type: "item",
        initialIndex: 0,
        index: 1,
        groupId: "management",
        initialGroup: "management",
        group: "management",
        permissionCode: "users",
      },
      { type: "item", groupId: "management", index: 1 }
    )

    expect(next.groups[1].items.map((item) => item.permissionCode)).toEqual([
      "roles",
      "users",
    ])
  })

  it("moves an item into another group", () => {
    const next = applyMenuDrag(
      makeConfig(),
      {
        type: "item",
        initialIndex: 0,
        index: 0,
        groupId: "management",
        initialGroup: "management",
        group: "empty",
        permissionCode: "users",
      },
      { type: "group-drop", groupId: "empty", index: 0 }
    )

    expect(next.groups[1].items.map((item) => item.permissionCode)).toEqual([
      "roles",
    ])
    expect(next.groups[2].items.map((item) => item.permissionCode)).toEqual([
      "users",
    ])
    expect(next.groups[2].items[0].groupId).toBe("empty")
  })

  it("appends to a group when dropped on the group body", () => {
    const next = applyMenuDrag(
      makeConfig(),
      {
        type: "item",
        initialIndex: 0,
        index: 0,
        groupId: "navigation",
        initialGroup: "navigation",
        group: "management",
        permissionCode: "dashboard",
      },
      { type: "group", groupId: "management", index: 1 }
    )

    expect(next.groups[1].items.map((item) => item.permissionCode)).toEqual([
      "users",
      "roles",
      "dashboard",
    ])
  })

  it("moves a group by drag", () => {
    const next = applyMenuDrag(makeConfig(), {
      type: "group",
      initialIndex: 0,
      index: 2,
      groupId: "navigation",
    })

    expect(next.groups.map((group) => group.id)).toEqual([
      "management",
      "empty",
      "navigation",
    ])
  })
})
