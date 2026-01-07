import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Index',
      component: () => import('@/pages/Index.vue'),
    },
    {
      path: '/auth',
      name: 'Auth',
      component: () => import('@/pages/AuthPage.vue'),
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/pages/DashboardPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'Admin',
      component: () => import('@/pages/AdminPage.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/pages/NotFound.vue'),
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  // Aguardar o carregamento inicial do auth se ainda estiver carregando
  if (authStore.isLoading) {
    // Se já tem token, aguardar o checkAuth terminar
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Aguardar até que o isLoading seja false
      while (authStore.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } else {
      // Se não tem token, pode prosseguir
      authStore.isLoading = false;
    }
  }
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Auth' });
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next({ name: 'Dashboard' });
  } else {
    next();
  }
});

export default router;

