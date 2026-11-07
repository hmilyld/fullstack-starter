import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { Role } from "@/types/role"
import { RoleBadge } from "./role-badge"

const roles: Role[] = [
  {
    id: "admin",
    name: "管理员",
    description: "",
    permissions: [],
    isPreset: true,
  },
  {
    id: "user",
    name: "普通用户",
    description: "",
    permissions: [],
    isPreset: true,
  },
  {
    id: "custom",
    name: "自定义角色",
    description: "",
    permissions: [],
    isPreset: false,
  },
]

describe("RoleBadge", () => {
  it("uses the default variant for admin", () => {
    render(<RoleBadge roleId="admin" roles={roles} />)

    expect(screen.getByText("管理员")).toHaveAttribute(
      "data-variant",
      "default"
    )
  })

  it("uses secondary for preset roles and outline for custom roles", () => {
    const { rerender } = render(<RoleBadge roleId="user" roles={roles} />)
    expect(screen.getByText("普通用户")).toHaveAttribute(
      "data-variant",
      "secondary"
    )

    rerender(<RoleBadge roleId="custom" roles={roles} />)
    expect(screen.getByText("自定义角色")).toHaveAttribute(
      "data-variant",
      "outline"
    )
  })

  it("falls back to an unknown role", () => {
    render(<RoleBadge roleId="missing" roles={roles} />)

    expect(screen.getByText("未知角色")).toHaveAttribute(
      "data-variant",
      "outline"
    )
  })
})
