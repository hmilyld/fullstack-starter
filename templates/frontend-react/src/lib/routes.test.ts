import { describe, expect, it } from "vitest"

import { buildBreadcrumbs } from "./routes"

describe("buildBreadcrumbs", () => {
  it("builds nested crumbs and keeps group segments unlinked", () => {
    expect(buildBreadcrumbs("/settings/user")).toEqual([
      { path: "/settings", label: "设置", hasRoute: false },
      { path: "/settings/user", label: "用户管理", hasRoute: true },
    ])
  })

  it("returns one crumb for a top-level page", () => {
    expect(buildBreadcrumbs("/dashboard")).toEqual([
      { path: "/dashboard", label: "仪表盘", hasRoute: true },
    ])
  })

  it("skips unknown segments", () => {
    expect(buildBreadcrumbs("/settings/unknown")).toEqual([
      { path: "/settings", label: "设置", hasRoute: false },
    ])
  })
})
