import { createBrowserRouter, Navigate } from "react-router"

import { AdminLayout } from "@/components/admin-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { RootLayout } from "@/components/root-layout"
import { FullPageLoader } from "@/components/shared/full-page-loader"
import { LoginPage } from "@/pages/auth/login"
import { RegisterPage } from "@/pages/auth/register"
import { RouteErrorPage } from "@/pages/route-error"

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <FullPageLoader />,
    element: <RootLayout />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
        handle: { titleKey: "auth.login.title" },
      },
      {
        path: "/register",
        element: <RegisterPage />,
        handle: { titleKey: "auth.register.title" },
      },
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          {
            path: "dashboard",
            handle: { titleKey: "dashboard.title" },
            lazy: async () => ({
              Component: (await import("@/pages/dashboard")).DashboardPage,
            }),
          },
          {
            path: "settings/user",
            handle: { titleKey: "users.title" },
            lazy: async () => ({
              Component: (await import("@/pages/settings/user")).UsersPage,
            }),
          },
          {
            path: "settings/role",
            handle: { titleKey: "rolesPage.title" },
            lazy: async () => ({
              Component: (await import("@/pages/settings/role")).RolesPage,
            }),
          },
          {
            path: "settings/permission",
            handle: { titleKey: "permissionPage.title" },
            lazy: async () => ({
              Component: (await import("@/pages/settings/permission"))
                .PermissionPage,
            }),
          },
          {
            path: "settings/menu",
            handle: { titleKey: "menuPage.title" },
            lazy: async () => ({
              Component: (await import("@/pages/settings/menu")).MenuPage,
            }),
          },
          {
            path: "settings/profile",
            handle: { titleKey: "profilePage.title" },
            lazy: async () => ({
              Component: (await import("@/pages/settings/profile")).ProfilePage,
            }),
          },
          {
            path: "settings/system",
            handle: { titleKey: "systemPage.title" },
            lazy: async () => ({
              Component: (await import("@/pages/settings/system")).SystemPage,
            }),
          },
          {
            path: "settings/ai-model",
            handle: { titleKey: "aiModelPage.title" },
            lazy: async () => ({
              Component: (await import("@/pages/settings/ai-model"))
                .AiModelPage,
            }),
          },
          {
            path: "settings/audit-log",
            handle: { titleKey: "auditLogPage.title" },
            lazy: async () => ({
              Component: (await import("@/pages/settings/audit-log"))
                .AuditLogPage,
            }),
          },
          {
            path: "settings/data",
            handle: { titleKey: "dataPage.title" },
            lazy: async () => ({
              Component: (await import("@/pages/settings/data-management"))
                .DataManagementPage,
            }),
          },
        ],
      },
      {
        path: "*",
        handle: { titleKey: "errors.notFoundTitle" },
        lazy: async () => ({
          Component: (await import("@/pages/not-found")).NotFoundPage,
        }),
      },
    ],
  },
])
