<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-4xl mx-auto px-6 py-8">
      <header class="mb-8">
        <div class="mb-6">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p class="text-gray-600">Manage your account preferences and notifications</p>
        </div>
      </header>

      <div class="space-y-6">
        <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                Browser Notifications
              </h3>
              <p class="text-sm text-gray-600 mb-4">
                Get browser notifications when a monitor goes down or comes back up while the tab is not focused.
              </p>
              
              <div v-if="browserPermission !== 'granted'" class="mb-4">
                <div 
                  :class="[
                    'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                    browserPermission === 'denied' 
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  ]"
                >
                  <svg v-if="browserPermission === 'denied'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                  <span v-if="browserPermission === 'denied'">
                    Browser notifications are blocked. Please enable them in your browser settings.
                  </span>
                  <span v-else>
                    Browser permission not granted.
                  </span>
                </div>
              </div>

              <button
                v-if="browserPermission === 'default'"
                @click="requestNotificationPermission"
                class="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors font-medium text-sm mb-4"
              >
                Enable Browser Notifications
              </button>
            </div>

            <div class="ml-4">
              <button
                @click="toggleBrowserNotifications"
                :disabled="browserPermission !== 'granted' || updating"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2',
                  notificationsEnabled && browserPermission === 'granted'
                    ? 'bg-pink-600'
                    : 'bg-gray-200',
                  browserPermission !== 'granted' && 'opacity-50 cursor-not-allowed'
                ]"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    notificationsEnabled && browserPermission === 'granted' ? 'translate-x-6' : 'translate-x-1'
                  ]"
                />
              </button>
            </div>
          </div>

          <div v-if="notificationsEnabled && browserPermission === 'granted'" class="mt-4 pt-6 border-t border-gray-200 flex justify-end">
            <button
              @click="sendTestNotification"
              class="px-4 py-2 text-pink-600 hover:bg-pink-50 border border-pink-200 rounded-lg transition-colors font-medium text-sm"
            >
              Send Test Notification
            </button>
          </div>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-8">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Account Information
          </h3>
          <div class="space-y-6">
            <div>
              <label class="text-sm font-medium text-gray-600 block mb-2">Name</label>
              <div v-if="!editingName" class="flex items-center gap-3">
                <p class="text-gray-900 flex-1">{{ authStore.user?.name }}</p>
                <button
                  @click="startEditingName"
                  class="px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-lg transition-all shadow-sm font-medium text-sm"
                >
                  Edit
                </button>
              </div>
              <div v-else class="flex items-center gap-3">
                <input
                  v-model="newName"
                  type="text"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter your name"
                  maxlength="128"
                  @keydown.enter="saveName"
                  @keydown.esc="cancelEditingName"
                />
                <button
                  @click="saveName"
                  :disabled="updatingName || !newName.trim()"
                  class="px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm"
                >
                  {{ updatingName ? 'Saving...' : 'Save' }}
                </button>
                <button
                  @click="cancelEditingName"
                  :disabled="updatingName"
                  class="px-4 py-2 text-gray-600 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
              </div>
              <p v-if="nameError" class="text-sm text-red-600 mt-1">{{ nameError }}</p>
            </div>
            
            <div>
              <label class="text-sm font-medium text-gray-600 block mb-2">Email</label>
              <p class="text-gray-900">{{ authStore.user?.email }}</p>
              <p class="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { browserNotifications } from '../utils/browserNotifications';
import { addToast, escapeHtml } from '../composables/useToast';

const authStore = useAuthStore();
const updating = ref(false);
const browserPermission = ref<'granted' | 'denied' | 'default'>('default');
const isDocumentFocused = ref(document.hasFocus());
const testLog = ref<Array<{time: string, message: string, type: string}>>([]);
const editingName = ref(false);
const newName = ref('');
const updatingName = ref(false);
const nameError = ref('');

const notificationsEnabled = computed(() => {
  return authStore.user?.browser_notifications_enabled ?? true;
});

const hasNotificationSupport = computed(() => {
  return 'Notification' in window;
});

function addLog(message: string, type: string = 'info') {
  const time = new Date().toLocaleTimeString();
  testLog.value.push({ time, message, type });
  console.log(`[${time}] ${message}`);
}

function updateFocusState() {
  isDocumentFocused.value = document.hasFocus();
}

onMounted(() => {
  browserPermission.value = browserNotifications.getPermission();

  window.addEventListener('focus', updateFocusState);
  window.addEventListener('blur', updateFocusState);
  document.addEventListener('visibilitychange', updateFocusState);
});

onUnmounted(() => {
  window.removeEventListener('focus', updateFocusState);
  window.removeEventListener('blur', updateFocusState);
  document.removeEventListener('visibilitychange', updateFocusState);
});

async function requestNotificationPermission() {
  addLog('Requesting notification permission...');
  const permission = await browserNotifications.requestPermission();
  browserPermission.value = permission;
  addLog(`Permission result: ${permission}`);
  
  if (permission === 'granted' && !notificationsEnabled.value) {
    addLog('Auto-enabling notifications in settings...');
    // Auto-enable if user just granted permission
    await toggleBrowserNotifications();
  }
}

async function toggleBrowserNotifications() {
  if (browserPermission.value !== 'granted') return;
  
  updating.value = true;
  try {
    const newValue = !notificationsEnabled.value;
    addLog(`Updating notification setting to: ${newValue}`);
    await authStore.updateNotificationSettings(newValue);
    addLog(`Settings updated successfully`);
  } catch (error) {
    console.error('Failed to update notification settings:', error);
    addLog(`Error: ${error}`, 'error');
    addToast('Failed to update notification settings. Please try again.', 'error');
  } finally {
    updating.value = false;
  }
}

async function sendTestNotification() {
  try {
    const result = await browserNotifications.showGenericNotification(
      'Test Notification',
      'Browser notifications are working! You\'ll receive alerts like this when the tab is not focused.',
      undefined,
      true // Force show even when tab is focused
    );
    
    if (result) {
      console.log('Test notification sent successfully');
    } else {
      addToast('Failed to send test notification. Please check your browser settings.', 'error');
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    addToast('Error sending test notification: ' + escapeHtml(String(error)), 'error');
  }
}

function startEditingName() {
  newName.value = authStore.user?.name || '';
  nameError.value = '';
  editingName.value = true;
}

function cancelEditingName() {
  editingName.value = false;
  newName.value = '';
  nameError.value = '';
}

async function saveName() {
  if (!newName.value.trim()) {
    nameError.value = 'Name cannot be empty';
    return;
  }

  if (newName.value.length > 128) {
    nameError.value = 'Name must be 128 characters or less';
    return;
  }

  updatingName.value = true;
  nameError.value = '';

  try {
    await authStore.updateProfile(newName.value.trim());
    editingName.value = false;
    newName.value = '';
  } catch (error: any) {
    console.error('Failed to update name:', error);
    nameError.value = error.message || 'Failed to update name. Please try again.';
  } finally {
    updatingName.value = false;
  }
}
</script>
