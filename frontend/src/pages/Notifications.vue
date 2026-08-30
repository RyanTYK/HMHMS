<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-7xl mx-auto px-6 py-8">
      <header class="mb-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p class="text-gray-600">Stay updated with monitor alerts</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="unreadNotifications.length > 0"
              @click="markAllAsRead"
              class="px-4 py-2 text-pink-700 bg-white hover:bg-pink-50 rounded-lg transition-all font-medium border border-pink-200"
            >
              Mark All as Read
            </button>
            <button
              v-if="unreadNotifications.length > 0"
              @click="clearAllNotifications"
              class="px-4 py-2 text-gray-700 bg-white hover:bg-gray-100 rounded-lg transition-all font-medium border border-gray-200"
            >
              Clear All
            </button>
          </div>
        </div>
      </header>

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
          <div class="p-4">
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
              <div class="flex items-center gap-3">
                <button
                  v-if="!notification.is_read"
                  @click="markAsRead(notification.id)"
                  class="text-gray-400 hover:text-pink-600"
                  title="Mark as read"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                  </svg>
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
        </div>
      </div>

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

      <div v-if="loading" class="space-y-4 animate-pulse">
        <div
          v-for="n in 4"
          :key="n"
          class="bg-white rounded-lg shadow-md border border-gray-200 p-4"
        >
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0"></div>
            <div class="flex-1">
              <div class="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div class="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div class="h-3 bg-gray-200 rounded w-1/6"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useNotificationsStore } from '../stores/notifications';

const notificationsStore = useNotificationsStore();

const activeTab = ref('all');
const loading = ref(false);

const tabs = computed(() => [
  { label: 'All', value: 'all', count: notificationsStore.notifications.length },
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
    const notificationIds = notificationsStore.notifications.map(n => n.id);
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
