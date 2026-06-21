import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/pages/auth/Login.vue'),
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/pages/auth/Register.vue'),
    },
    {
      path: '/',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard' },
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/pages/dashboard/Index.vue'),
        },
        {
          path: 'settings/user',
          name: 'UserManage',
          component: () => import('@/pages/settings/UserManage.vue'),
        },
        {
          path: 'settings/role',
          name: 'RoleManage',
          component: () => import('@/pages/settings/RoleManage.vue'),
        },
        {
          path: 'settings/permission',
          name: 'PermissionManage',
          component: () => import('@/pages/settings/PermissionManage.vue'),
        },
        {
          path: 'settings/profile',
          name: 'Profile',
          component: () => import('@/pages/settings/Profile.vue'),
        },
        {
          path: 'settings/system',
          name: 'System',
          component: () => import('@/pages/settings/System.vue'),
        },
        {
          path: 'settings/ai-model',
          name: 'AiModel',
          component: () => import('@/pages/settings/AiModel.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/pages/NotFound.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'Login' }
  }
})

export default router
