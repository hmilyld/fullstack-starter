import { createRouter, createWebHistory } from "vue-router"
import { setAppError } from "@/lib/app-error"
import { useAuthStore } from "@/stores/auth"

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "Login",
      meta: { titleKey: "auth.login.title" },
      component: () => import("@/pages/auth/Login.vue"),
    },
    {
      path: "/register",
      name: "Register",
      meta: { titleKey: "auth.register.title" },
      component: () => import("@/pages/auth/Register.vue"),
    },
    {
      path: "/",
      component: () => import("@/layouts/AdminLayout.vue"),
      meta: { requiresAuth: true },
      children: [
        { path: "", redirect: "/dashboard" },
        {
          path: "dashboard",
          name: "Dashboard",
          meta: { titleKey: "dashboard.title" },
          component: () => import("@/pages/dashboard/Index.vue"),
        },
        {
          path: "settings/user",
          name: "UserManage",
          meta: { titleKey: "users.title" },
          component: () => import("@/pages/settings/UserManage/index.vue"),
        },
        {
          path: "settings/role",
          name: "RoleManage",
          meta: { titleKey: "rolesPage.title" },
          component: () => import("@/pages/settings/RoleManage/index.vue"),
        },
        {
          path: "settings/permission",
          name: "PermissionManage",
          meta: { titleKey: "permissionPage.title" },
          component: () =>
            import("@/pages/settings/PermissionManage/index.vue"),
        },
        {
          path: "settings/profile",
          name: "Profile",
          meta: { titleKey: "profilePage.title" },
          component: () => import("@/pages/settings/Profile/index.vue"),
        },
        {
          path: "settings/system",
          name: "System",
          meta: { titleKey: "systemPage.title" },
          component: () => import("@/pages/settings/System/index.vue"),
        },
        {
          path: "settings/ai-model",
          name: "AiModel",
          meta: { titleKey: "aiModelPage.title" },
          component: () => import("@/pages/settings/AiModel/index.vue"),
        },
        {
          path: "settings/audit-log",
          name: "AuditLog",
          meta: { titleKey: "auditLogPage.title" },
          component: () => import("@/pages/settings/AuditLog/index.vue"),
        },
        {
          path: "settings/menu",
          name: "MenuManage",
          meta: { titleKey: "menuPage.title" },
          component: () => import("@/pages/settings/MenuManage/index.vue"),
        },
        {
          path: "settings/data",
          name: "DataManagement",
          meta: { titleKey: "dataPage.title" },
          component: () => import("@/pages/settings/DataManagement/index.vue"),
        },
      ],
    },
    {
      path: "/:pathMatch(.*)*",
      name: "NotFound",
      meta: { titleKey: "errors.notFoundTitle" },
      component: () => import("@/pages/NotFound.vue"),
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: "Login" }
  }
})

router.onError((error) => {
  setAppError(error)
})

export default router
