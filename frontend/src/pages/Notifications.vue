<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-7xl mx-auto px-6 py-8">
      <!-- Header -->
      <header class="mb-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p class="text-gray-600">Stay updated with monitor shares, team invites, and alerts</p>
          </div>
          <button
            v-if="unreadNotifications.length > 0"
            @click="clearAllNotifications"
            class="px-4 py-2 text-gray-700 bg-white hover:bg-gray-100 rounded-lg transition-all font-medium border border-gray-200"
          >
            Clear All
          </button>
        </div>
      </header>

      <!-- Tabs -->
      <div class="flex items-center gap-2 mb-6 border-b border-pink-200">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="activeTab = tab.value"
          :class="[
            'px-6 py-3 font-medium text-sm transition-all border-b-2 rounded-t-lg flex items-center gap-2',
            activeTab === tab.value
              ? 'text-pink-700 border-pink-600 bg-gradient-to-b from-pink-50 to-white'
              : 'text-gray-600 border-transparent hover:text-pink-600 hover:bg-pink-50'
          ]"
        >
          {{ tab.label }}
          <span
            v-if="tab.count > 0"
            :class="[
              'px-2.5 py-1 rounded-full text-xs font-semibold min-w-[24px] text-center',
              activeTab === tab.value
                ? 'bg-gradient-to-br from-pink-100 to-pink-200 text-pink-700'
                : 'bg-gray-100 text-gray-600'
            ]"
          >
            {{ tab.count }}
          </span>
        </button>
      </div>

      <!-- Notifications List -->
      <div v-if="!loading && filteredNotifications.length > 0" class="space-y-4">
        <div
          v-for="notification in filteredNotifications"
          :key="notification.id"
          :class="[
            'bg-white rounded-lg shadow-md border transition-all hover:shadow-lg',
            notification.is_read ? 'border-gray-200' : 'bg-pink-50'
          ]"
          :style="!notification.is_read ? 'border-color: #f0b8dc;' : ''"
        >
          <!-- Team Invite Notification -->
          <div v-if="notification.type === 'invite' && notification.related_team_id" class="p-4">
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full flex items-center justify-center" style="background-color: #fae7f3;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#cc1389" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ notification.title }}</h3>
                  <p class="text-gray-600 text-sm">{{ notification.message }}</p>
                  <span class="text-xs text-gray-500 mt-2 inline-block">{{ formatDate(notification.created_at) }}</span>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <button
                  @click="acceptTeamInvite(notification)"
                  :disabled="processingId === notification.id"
                  class="px-6 py-2 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                  style="background-color: #cc1389;"
                  @mouseenter="($event.target as HTMLElement).style.backgroundColor = '#b8117b'"
                  @mouseleave="($event.target as HTMLElement).style.backgroundColor = '#cc1389'"
                >
                  {{ processingId === notification.id ? 'Accepting...' : 'Accept Invite' }}
                </button>
                <button
                  @click="declineTeamInvite(notification)"
                  :disabled="processingId === notification.id"
                  class="px-6 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  Decline
                </button>
                <button
                  @click="deleteNotification(notification.id)"
                  class="text-gray-400 hover:text-red-600"
                  title="Delete"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Share Notification -->
          <div v-else-if="notification.type === 'share'" class="p-4">
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full flex items-center justify-center" style="background-color: #fae7f3;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#cc1389" stroke-width="2">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ notification.title }}</h3>
                  <p class="text-gray-600 text-sm">{{ notification.message }}</p>
                  <span class="text-xs text-gray-500 mt-2 inline-block">{{ formatDate(notification.created_at) }}</span>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <button
                  @click="viewSharesAndDismiss(notification.id)"
                  class="px-6 py-2 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                  style="background-color: #cc1389;"
                  @mouseenter="($event.target as HTMLElement).style.backgroundColor = '#b8117b'"
                  @mouseleave="($event.target as HTMLElement).style.backgroundColor = '#cc1389'"
                >
                  View Shares
                </button>
                <button
                  @click="dismissNotification(notification.id)"
                  class="px-6 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg font-medium transition-all"
                >
                  Dismiss
                </button>
                <button
                  @click="deleteNotification(notification.id)"
                  class="text-gray-400 hover:text-red-600"
                  title="Delete"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Alert/System Notification -->
          <div v-else class="p-4">
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-4">
                <div
                  :class="[
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    notification.type === 'alert' ? 'bg-gradient-to-br from-red-100 to-orange-100' : 'bg-gradient-to-br from-gray-100 to-gray-200'
                  ]"
                >
                  <svg
                    v-if="notification.type === 'alert'"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#dc2626"
                    stroke-width="2"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ notification.title }}</h3>
                  <p class="text-gray-600 text-sm">{{ notification.message }}</p>
                  <span class="text-xs text-gray-500 mt-2 inline-block">{{ formatDate(notification.created_at) }}</span>
                </div>
              </div>
              <button
                @click="deleteNotification(notification.id)"
                class="text-gray-400 hover:text-red-600"
                title="Delete"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!loading && filteredNotifications.length === 0"
        class="p-12 text-center"
      >
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center">
          <svg class="w-10 h-10 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
        <p class="text-gray-600">You're all caught up!</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-600"></div>
        <p class="mt-4 text-gray-600">Loading notifications...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationsStore, NotificationType } from '../stores/notifications';
import { useTeamsStore } from '../stores/teams';

const router = useRouter();
const notificationsStore = useNotificationsStore();
const teamsStore = useTeamsStore();

const activeTab = ref('all');
const processingId = ref<number | null>(null);
const loading = ref(false);

const tabs = computed(() => [
  { label: 'All', value: 'all', count: notificationsStore.notifications.length },
  { label: 'Shares', value: 'share', count: notificationsStore.shareNotifications.length },
  { label: 'Invites', value: 'invite', count: notificationsStore.inviteNotifications.length },
  { label: 'Alerts', value: 'alert', count: notificationsStore.alertNotifications.length },
]);

const filteredNotifications = computed(() => {
  if (activeTab.value === 'all') {
    return notificationsStore.notifications;
  }
  return notificationsStore.notifications.filter((n) => n.type === activeTab.value);
});

const unreadNotifications = computed(() => notificationsStore.unreadNotifications);

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const markAsRead = async (notificationId: number) => {
  try {
    await notificationsStore.markAsRead(notificationId);
  } catch (error) {
    console.error('Failed to mark as read:', error);
  }
};

const markAllAsRead = async () => {
  try {
    await notificationsStore.markAllAsRead();
  } catch (error) {
    console.error('Failed to mark all as read:', error);
  }
};

const clearAllNotifications = async () => {
  try {
    // Only clear read notifications and non-actionable items
    // Don't clear pending invites or pending shares
    const notificationIds = notificationsStore.notifications
      .filter(n => {
        // Keep pending invites (they require action)
        if (n.type === 'invite' && n.related_team_id) return false;
        // Keep unread share notifications (user may want to view them)
        if (n.type === 'share' && !n.is_read) return false;
        // Clear everything else (alerts, read shares, etc)
        return true;
      })
      .map(n => n.id);
    
    // Delete filtered notifications
    await Promise.all(notificationIds.map(id => notificationsStore.deleteNotification(id)));
  } catch (error) {
    console.error('Failed to clear all notifications:', error);
  }
};

const deleteNotification = async (notificationId: number) => {
  try {
    await notificationsStore.deleteNotification(notificationId);
  } catch (error) {
    console.error('Failed to delete notification:', error);
  }
};

const dismissNotification = async (notificationId: number) => {
  try {
    await notificationsStore.deleteNotification(notificationId);
  } catch (error) {
    console.error('Failed to dismiss notification:', error);
  }
};

const viewSharesAndDismiss = async (notificationId: number) => {
  try {
    // Delete the notification first
    await notificationsStore.deleteNotification(notificationId);
    // Then navigate to shares page with shared-with-me tab
    router.push('/shared?tab=shared-with-me');
  } catch (error) {
    console.error('Failed to process notification:', error);
    // Still navigate even if delete fails
    router.push('/shared?tab=shared-with-me');
  }
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const acceptTeamInvite = async (notification: any) => {
  if (!notification.related_team_id) return;

  processingId.value = notification.id;
  try {
    // Call backend to accept invite
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/teams/${notification.related_team_id}/accept-invite`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to accept invite');

    // Mark as read and delete notification
    await notificationsStore.markAsRead(notification.id);
    await notificationsStore.deleteNotification(notification.id);

    // Refresh teams list
    await teamsStore.fetchTeams();
  } catch (error) {
    console.error('Failed to accept invite:', error);
  } finally {
    processingId.value = null;
  }
};

const declineTeamInvite = async (notification: any) => {
  processingId.value = notification.id;
  try {
    // TODO: Implement decline team invite API call
    console.log('Decline team invite:', notification.related_team_id);
    
    // For now, just delete the notification
    await notificationsStore.deleteNotification(notification.id);
  } catch (error) {
    console.error('Failed to decline invite:', error);
  } finally {
    processingId.value = null;
  }
};

onMounted(async () => {
  loading.value = true;
  try {
    await notificationsStore.fetchNotifications();
    await notificationsStore.fetchUnreadCount();
  } finally {
    loading.value = false;
  }
});
</script>
