import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  { path: '/login', component: () => import('../pages/Login.vue'), meta: { public: true } },
  { path: '/register', component: () => import('../pages/Register.vue'), meta: { public: true } },
  { path: '/verify-email', component: () => import('../pages/VerifyEmail.vue'), meta: { public: true } },
  { path: '/auth/microsoft/callback', component: () => import('../pages/MicrosoftCallback.vue'), meta: { public: true } },
  
  // Personal/Individual Monitoring
  { path: '/', component: () => import('../pages/Dashboard.vue'), meta: { requiresAuth: true, section: 'individual' } },
  { path: '/monitor/:id', component: () => import('../pages/MonitorDetail.vue'), meta: { requiresAuth: true, section: 'individual' } },

  // Notifications
  { path: '/notifications', component: () => import('../pages/Notifications.vue'), meta: { requiresAuth: true, section: 'individual' } },

  // Settings
  { path: '/settings', component: () => import('../pages/Settings.vue'), meta: { requiresAuth: true, section: 'individual' } },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  const token = localStorage.getItem('token');
  
  if (to.meta.requiresAuth) {
    if (!token) {
      return { path: '/login', query: { redirect: to.fullPath } };
    }
    
    // Validate token by checking if we can fetch user info
    try {
      if (!authStore.user) {
        await authStore.me();
      }
      // If we still don't have a user after calling me(), token is invalid
      if (!authStore.user) {
        authStore.logout();
        return { path: '/login', query: { redirect: to.fullPath } };
      }
    } catch (error) {
      // Token is invalid or expired
      authStore.logout();
      return { path: '/login', query: { redirect: to.fullPath } };
    }

  }
  
  if (to.meta.public && token && authStore.user) {
    return { path: '/' };
  }
});

export default router;
