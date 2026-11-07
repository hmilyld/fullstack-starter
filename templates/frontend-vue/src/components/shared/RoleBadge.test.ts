import { render, screen } from "@testing-library/vue"
import { describe, expect, it } from "vitest"

import type { Role } from "@/types/role"
import RoleBadge from "./RoleBadge.vue"

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
    render(RoleBadge, { props: { roleId: "admin", roles } })

    expect(screen.getByText("管理员")).toHaveAttribute(
      "data-variant",
      "default"
    )
  })

  it("uses secondary for preset roles and outline for custom roles", async () => {
    const { rerender } = render(RoleBadge, {
      props: { roleId: "user", roles },
    })
    expect(screen.getByText("普通用户")).toHaveAttribute(
      "data-variant",
      "secondary"
    )

    await rerender({ roleId: "custom" })
    expect(screen.getByText("自定义角色")).toHaveAttribute(
      "data-variant",
      "outline"
    )
  })

  it("falls back to an unknown role", () => {
    render(RoleBadge, { props: { roleId: "missing", roles } })

    expect(screen.getByText("未知角色")).toHaveAttribute(
      "data-variant",
      "outline"
    )
  })
})
