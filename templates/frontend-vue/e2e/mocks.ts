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
    "roles.create",
    "roles.edit",
    "roles.delete",
    "permissions",
    "permissions.create",
    "permissions.edit",
    "permissions.delete",
    "menus",
    "menus.create",
    "menus.edit",
    "menus.delete",
    "menus.reorder",
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
    async (route) => {
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
        case "/api/menus/layout":
          await new Promise((resolve) => setTimeout(resolve, 500))
          return ok({ version: 2 })
        case "/api/menus":
          return ok({
            version: 1,
            groups: [
              {
                id: "management",
                name: "管理",
                sortOrder: 1,
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
                    hidden: false,
                    operations: [{ code: "users.create", name: "新增用户" }],
                  },
                  {
                    permissionCode: "menus",
                    name: "菜单与权限",
                    groupId: "management",
                    route: "/settings/menu",
                    icon: "panel-left",
                    sortOrder: 2,
                    isSystem: true,
                    hidden: false,
                    operations: [],
                  },
                ],
              },
            ],
          })
        case "/api/dashboard/stats":
          return ok({
            totalUsers: 1,
            activeNow: 1,
            revenue: "¥0",
            growth: "+0%",
          })
        case "/api/dashboard/activity":
          return ok([])
        case "/api/system/config":
          return ok({
            siteName: "管理系统",
            siteDescription: "",
            keywords: "",
            maintenanceEnabled: false,
            maintenanceMessage: "",
            openRegistration: true,
            manualReview: false,
            defaultRoleId: "user",
            welcomeMessage: "",
            smtpEnabled: false,
            smtpHost: "",
            smtpPort: 465,
            smtpUsername: "",
            smtpPassword: "",
            smtpFromName: "",
            smtpFromEmail: "",
            smtpUseSsl: true,
          })
        case "/api/users":
          return ok({ list: [user], total: 1, page: 1, pageSize: 8 })
        case "/api/roles":
          return ok({ list: [role], total: 1, page: 1, pageSize: 100 })
        case "/api/permissions": {
          const type = new URL(route.request().url()).searchParams.get("type")
          return ok(
            type === "menu"
              ? [
                  { code: "dashboard", name: "仪表盘", type: "menu" },
                  { code: "users", name: "用户管理", type: "menu" },
                  { code: "roles", name: "角色管理", type: "menu" },
                ]
              : [
                  {
                    code: "users.view",
                    name: "查看用户",
                    type: "operation",
                    parent: "users",
                  },
                  {
                    code: "users.create",
                    name: "新增用户",
                    type: "operation",
                    parent: "users",
                  },
                  {
                    code: "roles.view",
                    name: "查看角色",
                    type: "operation",
                    parent: "roles",
                  },
                ]
          )
        }
        case "/api/roles/user":
          return ok(role)
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
