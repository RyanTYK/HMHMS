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
              :disabled="notificationsStore.notifications.length === 0"
              @click="toggleSelectAll"
              :class="[
                'px-4 py-2 rounded-lg transition-all font-medium border disabled:opacity-40 disabled:cursor-not-allowed',
                allSelected
                  ? 'text-pink-700 bg-pink-50 border-pink-200 hover:bg-pink-100'
                  : 'text-gray-700 bg-white border-gray-200 hover:bg-gray-100 disabled:hover:bg-white'
              ]"
            >
              {{ allSelected ? 'Deselect All' : 'Select All' }}
            </button>
            <button
              :disabled="!canMarkAsRead"
              @click="handleMarkAsRead"
              class="px-4 py-2 text-pink-700 bg-white hover:bg-pink-50 rounded-lg transition-all font-medium border border-pink-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              {{ selectedIds.length > 0 ? 'Mark Selected as Read' : 'Mark All as Read' }}
            </button>
            <button
              :disabled="!canDelete"
              @click="handleDelete"
              class="px-4 py-2 text-gray-700 bg-white hover:bg-red-50 hover:text-red-600 rounded-lg transition-all font-medium border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700"
            >
              {{ selectedIds.length > 0 ? 'Delete Selected' : 'Clear All' }}
            </button>
          </div>
        </div>
      </header>

      <div v-if="!loading && notificationsStore.notifications.length > 0" class="space-y-4">
        <div
          v-for="group in groupedNotifications"
          :key="group.ids[0]"
          :class="[
            'rounded-lg shadow-md border transition-all hover:shadow-lg',
            isGroupSelected(group) ? 'ring-2 ring-pink-400' : '',
            group.is_read ? 'bg-white border-gray-200' : 'bg-pink-50'
          ]"
          :style="!group.is_read ? 'border-color: #f0b8dc;' : ''"
        >
          <div class="p-4">
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-4">
                <label class="relative flex items-center justify-center w-5 h-5 shrink-0 self-center cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="isGroupSelected(group)"
                    @change="toggleGroupSelect(group)"
                    class="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <span
                    :class="[
                      'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors',
                      isGroupSelected(group) ? 'bg-pink-600 border-pink-600' : 'bg-white border-gray-300 hover:border-pink-400'
                    ]"
                  >
                    <svg v-if="isGroupSelected(group)" class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </span>
                </label>
                <div
                  :class="[
                    'w-12 h-12 rounded-full flex items-center justify-center shrink-0 self-center',
                    group.type === 'alert' ? 'bg-gradient-to-br from-red-100 to-orange-100' : 'bg-gradient-to-br from-gray-100 to-gray-200'
                  ]"
                >
                  <svg
                    v-if="group.type === 'alert'"
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
                  <h3 class="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    {{ group.title }}
                    <span v-if="group.count > 1" class="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">×{{ group.count }}</span>
                  </h3>
                  <p class="text-gray-600 text-sm">{{ group.message }}</p>
                  <span class="text-xs text-gray-500 mt-2 inline-block">
                    {{ group.count > 1 ? 'Latest: ' : '' }}{{ formatDate(group.created_at) }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <button
                  v-if="!group.is_read"
                  @click="markGroupAsRead(group)"
                  class="text-gray-400 hover:text-pink-600"
                  title="Mark as read"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                  </svg>
                </button>
                <button
                  @click="deleteGroup(group)"
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
        v-else-if="!loading && notificationsStore.notifications.length === 0"
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

const loading = ref(false);

const unreadNotifications = computed(() => notificationsStore.unreadNotifications);

const selectedIds = ref<number[]>([]);

const allSelected = computed(() =>
  notificationsStore.notifications.length > 0 &&
  selectedIds.value.length === notificationsStore.notifications.length
);

function toggleSelectAll() {
  selectedIds.value = allSelected.value
    ? []
    : notificationsStore.notifications.map(n => n.id);
}

// The header's Mark as Read / Delete buttons act on the selection when one
// exists, otherwise on everything - avoids showing both an "All" and a
// "Selected" variant of the same action side by side.
const canMarkAsRead = computed(() =>
  selectedIds.value.length > 0
    ? notificationsStore.notifications.some(n => selectedIds.value.includes(n.id) && !n.is_read)
    : unreadNotifications.value.length > 0
);

const canDelete = computed(() =>
  selectedIds.value.length > 0 || notificationsStore.notifications.length > 0
);

async function handleMarkAsRead() {
  if (selectedIds.value.length > 0) await markSelectedAsRead();
  else await markAllAsRead();
}

async function handleDelete() {
  if (selectedIds.value.length > 0) await deleteSelected();
  else await clearAllNotifications();
}

interface NotificationGroup {
  ids: number[];
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  count: number;
}

// Repeat "down" reminders for the same monitor create near-identical rows -
// collapse consecutive ones sharing a title+message into a single card with
// a count, rather than showing each reminder as its own full-height card.
const groupedNotifications = computed<NotificationGroup[]>(() => {
  const groups: NotificationGroup[] = [];
  for (const n of notificationsStore.notifications) {
    const last = groups[groups.length - 1];
    if (last && last.title === n.title && last.message === n.message) {
      last.ids.push(n.id);
      last.count++;
      last.is_read = last.is_read && n.is_read;
    } else {
      groups.push({ ids: [n.id], type: n.type, title: n.title, message: n.message, created_at: n.created_at, is_read: n.is_read, count: 1 });
    }
  }
  return groups;
});

function isGroupSelected(group: NotificationGroup) {
  return group.ids.every(id => selectedIds.value.includes(id));
}

function toggleGroupSelect(group: NotificationGroup) {
  selectedIds.value = isGroupSelected(group)
    ? selectedIds.value.filter(id => !group.ids.includes(id))
    : [...new Set([...selectedIds.value, ...group.ids])];
}

const markSelectedAsRead = async () => {
  try {
    await Promise.all(selectedIds.value.map(id => notificationsStore.markAsRead(id)));
    selectedIds.value = [];
  } catch (error) {
    console.error('Failed to mark selected as read:', error);
  }
};

const deleteSelected = async () => {
  try {
    await Promise.all(selectedIds.value.map(id => notificationsStore.deleteNotification(id)));
    selectedIds.value = [];
  } catch (error) {
    console.error('Failed to delete selected notifications:', error);
  }
};

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

const markGroupAsRead = async (group: NotificationGroup) => {
  try {
    await Promise.all(group.ids.map(id => notificationsStore.markAsRead(id)));
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

const deleteGroup = async (group: NotificationGroup) => {
  try {
    await Promise.all(group.ids.map(id => notificationsStore.deleteNotification(id)));
    selectedIds.value = selectedIds.value.filter(id => !group.ids.includes(id));
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

<style scoped>
/* manual-styles.css has its own unlayered, hardcoded `.shadow-md { box-shadow:
   ... }` (a pre-Tailwind-v4 leftover) that always wins the box-shadow property
   over Tailwind's layered shadow-md/ring-2, since Tailwind composites both
   into a single box-shadow declaration that this rule fully replaces. Restate
   both effects together with !important - same pattern as the checkbox fix. */
.ring-2.ring-pink-400 {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    0 0 0 2px #f472b6 !important;
}
</style>
