<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { useNotificationsStore } from './stores/notifications';
import { browserNotifications } from './utils/browserNotifications';
import Sidebar from './components/Sidebar.vue';
import ToastContainer from './components/ToastContainer.vue';

const route = useRoute();
const authStore = useAuthStore();
const notificationsStore = useNotificationsStore();
const isRouterReady = ref(false);

// Use computed to reactively hide Sidebar on public pages (login, register)
const showSidebar = computed(() => {
  // Don't show Sidebar until router is ready AND we're not on a public page
  return isRouterReady.value && !route.meta.public;
});

// Wait for the first route to be fully resolved
watch(() => route.path, () => {
  isRouterReady.value = true;
}, { immediate: true });

// SSE for real-time notification updates
let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

onMounted(async () => {
  // Only set up SSE if user is authenticated
  if (authStore.isAuthenticated) {
    setupSSE();
  }
});

onUnmounted(() => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
});

function setupSSE() {
  const token = authStore.token;
  if (!token) return;

  // Never leave a previous stream open when (re)connecting
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }

  // Create SSE connection for notifications
  eventSource = new EventSource(`/api/events${token ? `?token=${encodeURIComponent(token)}` : ''}`);

  eventSource.addEventListener('notification', async (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      console.log('New notification received:', data);

      // Update notification store
      await notificationsStore.fetchUnreadCount();

      // Show browser notification if enabled and tab is not focused
      if (authStore.user?.browser_notifications_enabled !== false) {
        // Determine notification type and show appropriate browser notification
        if (data.type === 'share') {
          await browserNotifications.showShareNotification(
            data.sharedBy || 'Someone',
            data.monitorName || 'a monitor'
          );
        } else if (data.type === 'invite') {
          await browserNotifications.showTeamInviteNotification(
            data.teamName || 'a team',
            data.invitedBy || 'Someone'
          );
        } else if (data.type === 'alert') {
          await browserNotifications.showMonitorAlert(
            data.monitorName || 'Monitor',
            data.status || 'changed',
            data.monitorId
          );
        } else {
          // Generic notification
          await browserNotifications.showGenericNotification(
            data.title || 'New Notification',
            data.message || 'You have a new notification',
            data.id
          );
        }
      }
    } catch (error) {
      console.error('Error handling notification event:', error);
    }
  });

  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
    // Close the failed stream so we never stack duplicate connections
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    // Only ever keep one pending reconnect
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (authStore.isAuthenticated) {
        setupSSE();
      }
    }, 5000);
  };
}

// Watch for authentication changes
watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth && !eventSource) {
    setupSSE();
  } else if (!isAuth && eventSource) {
    eventSource.close();
    eventSource = null;
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <Sidebar v-if="showSidebar" />
    
    <!-- Main Content -->
    <main :style="showSidebar ? 'margin-left: 240px;' : ''" class="min-h-screen">
      <ToastContainer />
      <router-view v-slot="{ Component }">
        <transition name="page-transition" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style>
.page-transition-enter-active,
.page-transition-leave-active {
  transition: opacity 0.15s ease;
}

.page-transition-enter-from,
.page-transition-leave-to {
  opacity: 0;
}
</style>
