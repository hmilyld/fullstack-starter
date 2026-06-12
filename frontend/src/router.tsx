import { createBrowserRouter, Navigate } from "react-router"
import { AdminLayout } from "@/components/admin-layout"
import { LoginPage } from "@/pages/auth/login"
import { RegisterPage } from "@/pages/auth/register"
import { DashboardPage } from "@/pages/dashboard"
import { UsersPage } from "@/pages/settings/user"
import { RolesPage } from "@/pages/settings/role"
import { PermissionPage } from "@/pages/settings/permission"
import { ProfilePage } from "@/pages/settings/profile"
import { SystemPage } from "@/pages/settings/system"
import { NotFoundPage } from "@/pages/not-found"
import { ProtectedRoute } from "@/components/protected-route"

export const router = createBrowserRouter([
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
      { path: "dashboard", element: <DashboardPage /> },
      { path: "settings/user", element: <UsersPage /> },
      { path: "settings/role", element: <RolesPage /> },
      { path: "settings/permission", element: <PermissionPage /> },
      { path: "settings/profile", element: <ProfilePage /> },
      { path: "settings/system", element: <SystemPage /> },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
])
