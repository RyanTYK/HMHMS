<template>
  <aside class="sidebar">
    <!-- Logo -->
    <div class="sidebar-logo">
      <img src="/centific-logo.png" alt="Logo" class="logo-icon" />
      <span class="logo-text">HMHMS</span>
    </div>

    <!-- Mobile Menu Toggle -->
    <button 
      @click="toggleMobile" 
      class="mobile-menu-toggle lg:hidden"
      aria-label="Toggle menu"
    >
      <svg v-if="!isMobileOpen" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      <svg v-else width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- Navigation -->
    <nav class="sidebar-nav" :class="{ 'mobile-open': isMobileOpen }">
      <!-- Individual Monitoring Section -->
      <div class="nav-section">
        <h3 class="nav-section-title">MONITORING</h3>

        <router-link to="/" class="nav-link" active-class="active" exact>
          <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span class="nav-text">Dashboard</span>
        </router-link>

        <!-- Personal Monitor Detail Subsection -->
        <div v-if="showPersonalMonitorSubsection" class="nav-subsection">
          <router-link :to="currentPersonalMonitorRoute" class="nav-link-subsection" active-class="active">
            <svg class="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            </svg>
            <span class="nav-text">Monitor Detail</span>
          </router-link>
        </div>

        <router-link to="/notifications" class="nav-link" active-class="active">
          <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span class="nav-text">Notifications</span>
          <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
        </router-link>

      </div>
    </nav>

    <!-- Bottom Section -->
    <div class="sidebar-bottom">
      <!-- Settings -->
      <router-link to="/settings" class="bottom-link" active-class="active">
        <svg class="bottom-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 4.205a.75.75 0 011.5 0v1.04a7.5 7.5 0 013.03 1.26l.735-.735a.75.75 0 111.06 1.06l-.735.735a7.5 7.5 0 011.26 3.03h1.04a.75.75 0 010 1.5h-1.04a7.5 7.5 0 01-1.26 3.03l.735.735a.75.75 0 11-1.06 1.06l-.735-.735a7.5 7.5 0 01-3.03 1.26v1.04a.75.75 0 01-1.5 0v-1.04a7.5 7.5 0 01-3.03-1.26l-.735.735a.75.75 0 11-1.06-1.06l.735-.735a7.5 7.5 0 01-1.26-3.03H4.205a.75.75 0 010-1.5h1.04a7.5 7.5 0 011.26-3.03l-.735-.735a.75.75 0 111.06-1.06l.735.735a7.5 7.5 0 013.03-1.26v-1.04zM12 9.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
        </svg>
        <span class="bottom-text">Settings</span>
      </router-link>

      <!-- Log out -->
      <button @click="handleLogout" class="bottom-link">
        <svg class="bottom-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span class="bottom-text">Log out</span>
        <span v-if="userName" class="user-name-bottom">{{ userName }}</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '../stores/notifications';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const notificationsStore = useNotificationsStore();

const isMobileOpen = ref(false);
const unreadCount = computed(() => notificationsStore.unreadCount);

onMounted(() => {
  notificationsStore.fetchUnreadCount();
});

const userName = computed(() => authStore.user?.name || authStore.user?.email || '');

// Check if current route is a personal monitor detail page
const showPersonalMonitorSubsection = computed(() => {
  return route.path.startsWith('/monitor/') && route.params.id;
});

// Get current monitor route (personal)
const currentPersonalMonitorRoute = computed(() => {
  return route.path;
});

function toggleMobile() {
  isMobileOpen.value = !isMobileOpen.value;
}

function handleLogout() {
  authStore.logout();
  router.replace('/login');
}
</script>

<style scoped>
.sidebar {
  width: 240px;
  background-color: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 100;
  transition: transform 0.3s ease;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  border-bottom: 1px solid #f3f4f6;
}

.logo-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.mobile-menu-toggle {
  display: none;
  position: absolute;
  top: 20px;
  right: 16px;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
}

.nav-section {
  margin-bottom: 24px;
}

.nav-section-title {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 0 16px;
  margin-bottom: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  margin: 2px 8px;
  text-decoration: none;
  color: #6b7280;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;
  position: relative;
}

.nav-link-sub {
  padding-left: 48px;
  margin-left: 8px;
  font-size: 13px;
  border-left: 2px solid #f0b8dc;
}

.nav-link:hover {
  background-color: transparent;
  color: #cc1389;
}

.nav-link.active {
  background-color: transparent;
  color: #8f0d60;
  font-weight: 500;
  position: relative;
}

.nav-link.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #cc1389;
  border-radius: 0 2px 2px 0;
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-text {
  font-size: 14px;
  font-weight: 500;
  flex: 1;
}

.notification-badge {
  background-color: #cc1389;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

/* Subsection Styles */
.nav-subsection {
  margin: 0;
  padding: 0;
}

.nav-subsection-nested {
  margin: 0;
}

.nav-subsection-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px 8px 28px;
  margin-top: 4px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.3px;
  border-top: 1px solid #f3f4f6;
}

.nav-text-small {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.nav-link-subsection {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px 9px 40px;
  margin: 1px 12px 1px 8px;
  text-decoration: none;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s;
  cursor: pointer;
  position: relative;
}

.nav-link-subsection:hover {
  background-color: transparent;
  color: #cc1389;
}

.nav-link-subsection.active {
  background-color: transparent;
  color: #8f0d60;
  font-weight: 600;
}

.nav-link-subsection.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #cc1389;
  border-radius: 0 2px 2px 0;
}

.sidebar-bottom {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
}

.bottom-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
  margin: 2px 0;
  text-decoration: none;
  color: #6b7280;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
}

.bottom-link:hover {
  background-color: #fae7f3;
  color: #cc1389;
}

.bottom-link.active {
  background-color: transparent;
  color: #8f0d60;
  font-weight: 500;
  position: relative;
}

.bottom-link.active::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: #cc1389;
  border-radius: 0 2px 2px 0;
}

.bottom-link:hover .user-name-bottom {
  color: #cc1389;
}

.bottom-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.bottom-text {
  font-size: 14px;
  font-weight: 500;
}

.user-name-bottom {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  margin-left: auto;
}

/* Mobile Responsive */
@media (max-width: 1023px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .mobile-menu-toggle {
    display: block;
  }

  .sidebar-nav {
    display: none;
  }

  .sidebar-nav.mobile-open {
    display: block;
  }
}
</style>
