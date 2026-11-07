import { createBrowserRouter, Navigate } from "react-router"

import { AdminLayout } from "@/components/admin-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { LoginPage } from "@/pages/auth/login"
import { RegisterPage } from "@/pages/auth/register"
import { RouteErrorPage } from "@/pages/route-error"

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
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
            lazy: async () => ({
              Component: (await import("@/pages/dashboard")).DashboardPage,
            }),
          },
          {
            path: "settings/user",
            lazy: async () => ({
              Component: (await import("@/pages/settings/user")).UsersPage,
            }),
          },
          {
            path: "settings/role",
            lazy: async () => ({
              Component: (await import("@/pages/settings/role")).RolesPage,
            }),
          },
          {
            path: "settings/permission",
            lazy: async () => ({
              Component: (await import("@/pages/settings/permission"))
                .PermissionPage,
            }),
          },
          {
            path: "settings/menu",
            lazy: async () => ({
              Component: (await import("@/pages/settings/menu")).MenuPage,
            }),
          },
          {
            path: "settings/profile",
            lazy: async () => ({
              Component: (await import("@/pages/settings/profile")).ProfilePage,
            }),
          },
          {
            path: "settings/system",
            lazy: async () => ({
              Component: (await import("@/pages/settings/system")).SystemPage,
            }),
          },
          {
            path: "settings/ai-model",
            lazy: async () => ({
              Component: (await import("@/pages/settings/ai-model"))
                .AiModelPage,
            }),
          },
          {
            path: "settings/audit-log",
            lazy: async () => ({
              Component: (await import("@/pages/settings/audit-log"))
                .AuditLogPage,
            }),
          },
          {
            path: "settings/data",
            lazy: async () => ({
              Component: (await import("@/pages/settings/data-management"))
                .DataManagementPage,
            }),
          },
        ],
      },
      {
        path: "*",
        lazy: async () => ({
          Component: (await import("@/pages/not-found")).NotFoundPage,
        }),
      },
    ],
  },
])
