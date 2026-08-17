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
  
  // Team Management
  { path: '/teams', component: () => import('../pages/Teams.vue'), meta: { requiresAuth: true, section: 'team' } },
  { path: '/teams/:id', component: () => import('../pages/TeamDetail.vue'), meta: { requiresAuth: true, section: 'team' } },
  
  // Team Monitors
  { path: '/teams/:teamId/monitors', component: () => import('../pages/teams/TeamMonitorList.vue'), meta: { requiresAuth: true, section: 'team' } },
  { path: '/teams/:teamId/monitors/:monitorId', component: () => import('../pages/teams/TeamMonitorDetails.vue'), meta: { requiresAuth: true, section: 'team' } },
  
  // Notifications
  { path: '/notifications', component: () => import('../pages/Notifications.vue'), meta: { requiresAuth: true, section: 'individual' } },
  
  // Settings
  { path: '/settings', component: () => import('../pages/Settings.vue'), meta: { requiresAuth: true, section: 'individual' } },
  
  // Shared Monitors
  { path: '/shared', component: () => import('../pages/SharedMonitors.vue'), meta: { requiresAuth: true, section: 'individual' } },
  
  // Future routes (placeholders)
  { path: '/bulk-import', component: () => import('../pages/Dashboard.vue'), meta: { requiresAuth: true, section: 'individual' } }, // TODO: Session 6
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

    // Check team-specific role permissions
    if (to.meta.section === 'team' && to.params.teamId && to.meta.requiresRole) {
      const teamId = parseInt(to.params.teamId as string);
      
      // Fetch team info to check role (this should be cached in the teams store)
      try {
        const teamsStore = await import('../stores/teams').then(m => m.useTeamsStore());
        
        // Ensure teams are loaded
        if (teamsStore.teams.length === 0) {
          await teamsStore.fetchTeams();
        }
        
        const team = teamsStore.teams.find(t => t.id === teamId);
        if (!team) {
          return { path: '/teams' };
        }
        
        // Find current user's role in this team
        const currentUserId = authStore.user?.id;
        const member = team.members?.find((m: any) => m.user_id === currentUserId);
        
        if (!member) {
          // Not a member
          return { path: '/teams' };
        }
        
        // Check if user has required role
        const allowedRoles = to.meta.requiresRole as string[];
        if (!allowedRoles.includes(member.role)) {
          // Not authorized (member trying to access owner/admin route)
          return { path: `/teams/${teamId}/monitors` };
        }
      } catch (error) {
        console.error('Error checking team permissions:', error);
        return { path: '/teams' };
      }
    }
  }
  
  if (to.meta.public && token && authStore.user) {
    return { path: '/' };
  }
});

export default router;
