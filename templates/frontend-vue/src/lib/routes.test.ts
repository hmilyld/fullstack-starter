import { describe, expect, it } from "vitest"
import { buildBreadcrumbs } from "./routes"

describe("buildBreadcrumbs", () => {
  it("maps known segments to labels", () => {
    expect(buildBreadcrumbs("/settings/user")).toEqual([
      { path: "/settings", label: "设置", hasRoute: false },
      { path: "/settings/user", label: "用户管理", hasRoute: true },
    ])
  })

  it("ignores unknown segments and trailing slashes", () => {
    expect(buildBreadcrumbs("/dashboard/extra/")).toEqual([
      { path: "/dashboard", label: "仪表盘", hasRoute: true },
    ])
  })

  it("keeps AI model label spaced", () => {
    expect(buildBreadcrumbs("/settings/ai-model").at(-1)?.label).toBe(
      "AI 模型配置"
    )
  })
})
