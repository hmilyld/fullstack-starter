import type { Page } from "@playwright/test"

export const authUser = {
  id: "1",
  name: "管理员",
  email: "admin@example.com",
  avatar: "",
  role: "admin",
  permissions: [
    "dashboard",
    "users",
    "users.create",
    "users.edit",
    "users.delete",
    "users.assign_role",
    "roles",
    "permissions",
    "menus",
    "settings",
    "ai_models",
    "audit_logs",
    "data_management.export",
  ],
}

const role = {
  id: "user",
  name: "普通用户",
  description: "拥有基本的查看权限",
  permissions: ["dashboard"],
  isPreset: true,
}

const user = {
  id: "2",
  username: "zhangsan",
  name: "张三",
  email: "zhangsan@example.com",
  roleId: "user",
  avatar: "",
}

const navigation = [
  {
    id: "main",
    name: "管理",
    sortOrder: 1,
    items: [
      {
        permissionCode: "dashboard",
        name: "仪表盘",
        route: "/dashboard",
        icon: "layout-dashboard",
        sortOrder: 1,
      },
      {
        permissionCode: "users",
        name: "用户管理",
        route: "/settings/user",
        icon: "users",
        sortOrder: 2,
      },
    ],
  },
]

export async function mockApi(page: Page) {
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    (route) => {
      const path = new URL(route.request().url()).pathname
      const ok = (data: unknown) =>
        route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ code: 0, message: "success", data }),
        })

      switch (path) {
        case "/api/public/config":
          return ok({
            siteName: "管理系统",
            siteDescription: "",
            maintenanceEnabled: false,
            maintenanceMessage: "",
            openRegistration: true,
            manualReview: false,
          })
        case "/api/auth/login":
          return ok({ token: "e2e-token", user: authUser })
        case "/api/menus/navigation":
          return ok(navigation)
        case "/api/dashboard/stats":
          return ok({
            totalUsers: 1,
            activeNow: 1,
            revenue: "¥0",
            growth: "+0%",
          })
        case "/api/dashboard/activity":
          return ok([])
        case "/api/users":
          return ok({ list: [user], total: 1, page: 1, pageSize: 8 })
        case "/api/roles":
          return ok({ list: [role], total: 1, page: 1, pageSize: 100 })
        case "/api/audit-logs":
          return ok({
            list: [
              {
                id: "1",
                userId: "1",
                username: "admin",
                action: "login",
                ip: "127.0.0.1",
                status: "success",
                detail: "",
                createdAt: "2026-11-07T12:00:00Z",
              },
            ],
            total: 1,
            page: 1,
            pageSize: 10,
          })
        default:
          return route.fulfill({
            contentType: "application/json",
            body: JSON.stringify({
              code: -1,
              message: `unmocked ${path}`,
              data: null,
            }),
          })
      }
    }
  )
}

export async function seedAuth(page: Page) {
  await page.addInitScript((user) => {
    localStorage.setItem("token", "e2e-token")
    localStorage.setItem("user", JSON.stringify(user))
  }, authUser)
}
