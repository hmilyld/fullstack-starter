import { describe, expect, it } from "vitest"

import {
  OPERATION_PRESETS,
  buildOperationCode,
  buildPermissionTree,
  filterPermissionTree,
} from "./access-tree"
import type { Permission } from "#lib/types/permission.js"

const menu = (code: string, name: string): Permission => ({
  code,
  name,
  type: "menu",
})

const operation = (code: string, name: string, parent: string): Permission => ({
  code,
  name,
  type: "operation",
  parent,
})

describe("access-tree", () => {
  it("groups operation permissions under their menu", () => {
    const tree = buildPermissionTree(
      [menu("users", "用户管理"), menu("roles", "角色管理")],
      [
        operation("users.create", "新增用户", "users"),
        operation("users.edit", "编辑用户", "users"),
        operation("roles.edit", "编辑角色", "roles"),
      ]
    )

    expect(tree).toHaveLength(2)
    expect(tree[0].children.map((item) => item.code)).toEqual([
      "users.create",
      "users.edit",
    ])
    expect(tree[1].children.map((item) => item.code)).toEqual(["roles.edit"])
  })

  it("keeps all children when a menu matches and narrows children otherwise", () => {
    const tree = buildPermissionTree(
      [menu("users", "用户管理"), menu("roles", "角色管理")],
      [
        operation("users.create", "新增用户", "users"),
        operation("users.edit", "编辑用户", "users"),
        operation("roles.edit", "编辑角色", "roles"),
      ]
    )

    const byMenu = filterPermissionTree(tree, "用户管理")
    expect(byMenu).toHaveLength(1)
    expect(byMenu[0].children).toHaveLength(2)

    const byOperation = filterPermissionTree(tree, "编辑角色")
    expect(byOperation).toHaveLength(1)
    expect(byOperation[0].code).toBe("roles")
    expect(byOperation[0].children.map((item) => item.code)).toEqual([
      "roles.edit",
    ])
  })

  it("builds operation codes from the menu code and preset verb", () => {
    expect(buildOperationCode("users", "create")).toBe("users.create")
    expect(OPERATION_PRESETS.map((preset) => preset.verb)).toContain("export")
  })
})
