<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-7xl mx-auto px-6 py-8">
      <!-- Header -->
      <header class="mb-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Share Monitors</h1>
            <p class="text-gray-600">Share your monitors with others and view monitors shared with you</p>
          </div>
          <!-- Share Selected Button (Always Present, Hidden When Not Needed) -->
          <div v-if="myMonitors.length > 0 && selectedMonitors.length > 0 && activeTab === 'my-monitors'" class="flex items-center gap-3">
            <button 
              class="btn-share-selected"
              @click="openBulkShareModal"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
              Share {{ selectedMonitors.length }} Selected
            </button>
          </div>
        </div>
      </header>

      <!-- Tabs with Search Bar -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-2 border-b border-pink-200">
          <button
            @click="activeTab = 'my-monitors'"
            :class="[
              'px-6 py-3 font-medium text-sm transition-all border-b-2 rounded-t-lg flex items-center gap-2',
              activeTab === 'my-monitors'
                ? 'text-pink-700 border-pink-600 bg-gradient-to-b from-pink-50 to-white'
                : 'text-gray-600 border-transparent hover:text-pink-600 hover:bg-pink-50'
            ]"
          >
            My Monitors
            <span
              v-if="myMonitors.length > 0"
              :class="[
                'px-2.5 py-1 rounded-full text-xs font-semibold min-w-[24px] text-center',
                activeTab === 'my-monitors'
                  ? 'bg-gradient-to-br from-pink-100 to-pink-200 text-pink-700'
                  : 'bg-gray-100 text-gray-600'
              ]"
            >
              {{ myMonitors.length }}
            </span>
          </button>
          <button
            @click="activeTab = 'shared-with-me'"
            :class="[
              'px-6 py-3 font-medium text-sm transition-all border-b-2 rounded-t-lg flex items-center gap-2',
              activeTab === 'shared-with-me'
                ? 'text-pink-700 border-pink-600 bg-gradient-to-b from-pink-50 to-white'
                : 'text-gray-600 border-transparent hover:text-pink-600 hover:bg-pink-50'
            ]"
          >
            Shared With Me
            <span
              v-if="pendingShares.length > 0"
              :class="[
                'px-2.5 py-1 rounded-full text-xs font-semibold min-w-[24px] text-center',
                activeTab === 'shared-with-me'
                  ? 'bg-gradient-to-br from-pink-100 to-pink-200 text-pink-700'
                  : 'bg-gray-100 text-gray-600'
              ]"
            >
              {{ pendingShares.length }}
            </span>
          </button>
          <button
            @click="activeTab = 'shared-by-me'"
            :class="[
              'px-6 py-3 font-medium text-sm transition-all border-b-2 rounded-t-lg flex items-center gap-2',
              activeTab === 'shared-by-me'
                ? 'text-pink-700 border-pink-600 bg-gradient-to-b from-pink-50 to-white'
                : 'text-gray-600 border-transparent hover:text-pink-600 hover:bg-pink-50'
            ]"
          >
            Shared By Me
            <span
              v-if="sentShares.length > 0"
              :class="[
                'px-2.5 py-1 rounded-full text-xs font-semibold min-w-[24px] text-center',
                activeTab === 'shared-by-me'
                  ? 'bg-gradient-to-br from-pink-100 to-pink-200 text-pink-700'
                  : 'bg-gray-100 text-gray-600'
              ]"
            >
              {{ sentShares.length }}
            </span>
          </button>
        </div>
        
        <!-- Search Bar -->
        <div v-if="activeTab === 'my-monitors'" class="relative flex-1 max-w-md">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search monitors..."
            class="w-full h-10 pl-4 pr-20 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-9 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>

    <!-- My Monitors Tab - List of monitors to share -->
    <div v-if="activeTab === 'my-monitors'" class="content-section">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading monitors...</p>
      </div>

      <div v-else-if="myMonitors.length === 0" class="empty-state">
        <div class="w-20 h-20 bg-gradient-to-br from-pink-50 to-pink-100 rounded-full mx-auto mb-6 flex items-center justify-center">
          <svg class="w-10 h-10 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </div>
        <h3>No Monitors Available</h3>
        <p>Create monitors in your dashboard to share them with others</p>
      </div>

      <div v-else-if="filteredMonitors.length === 0" class="empty-state">
        <div class="w-20 h-20 bg-gradient-to-br from-pink-50 to-pink-100 rounded-full mx-auto mb-6 flex items-center justify-center">
          <svg class="w-10 h-10 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </div>
        <h3>No Monitors Found</h3>
        <p>Try a different search term</p>
      </div>

      <div v-else class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead style="background-color: white !important;" class="border-b-2 border-[#cc1389]">
              <tr>
                <th class="text-left py-3 px-6 font-medium text-[#7a0b52] text-xs uppercase tracking-wide">
                  <label class="checkbox-container">
                    <input 
                      type="checkbox" 
                      :checked="selectedMonitors.length === filteredMonitors.length"
                      @change="toggleSelectAll"
                    />
                    <span class="checkmark"></span>
                  </label>
                </th>
                <th class="text-left py-3 px-2 font-medium text-[#7a0b52] text-xs uppercase tracking-wide w-16">
                </th>
                <th class="text-left py-3 px-3 font-medium text-[#7a0b52] text-xs uppercase tracking-wide">
                  Monitor Name
                </th>
                <th class="text-left py-3 px-6 font-medium text-[#7a0b52] text-xs uppercase tracking-wide">
                  Type
                </th>
                <th class="text-left py-3 px-6 font-medium text-[#7a0b52] text-xs uppercase tracking-wide">
                  Target
                </th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="monitor in filteredMonitors" 
                :key="monitor.id"
                :class="[
                  'border-b border-[#f0b8dc] transition-colors cursor-pointer',
                  isSelected(monitor.id) 
                    ? 'bg-pink-50 shadow-inner' 
                    : 'hover:bg-[#fae7f3]'
                ]"
              >
                <td class="py-3 px-6" @click.stop>
                  <label class="checkbox-container">
                    <input 
                      type="checkbox" 
                      :checked="isSelected(monitor.id)"
                      @change="toggleSelect(monitor.id)"
                    />
                    <span class="checkmark"></span>
                  </label>
                </td>
                <td class="py-3 px-2">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-pink-100 to-pink-200">
                    <svg v-if="monitor.type === 'http'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cc1389" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                    <svg v-else-if="monitor.type === 'tcp'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cc1389" stroke-width="2">
                      <rect x="2" y="3" width="20" height="7" rx="2" ry="2"></rect>
                      <rect x="2" y="14" width="20" height="7" rx="2" ry="2"></rect>
                      <line x1="6" y1="6" x2="6" y2="7"></line>
                      <line x1="10" y1="6" x2="10" y2="7"></line>
                      <line x1="14" y1="6" x2="14" y2="7"></line>
                      <line x1="6" y1="17" x2="6" y2="18"></line>
                      <line x1="10" y1="17" x2="10" y2="18"></line>
                      <line x1="14" y1="17" x2="14" y2="18"></line>
                    </svg>
                    <svg v-else-if="monitor.type === 'ping'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cc1389" stroke-width="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cc1389" stroke-width="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                </td>
                <td class="py-3 px-3">
                  <span class="font-medium text-gray-900">{{ monitor.name }}</span>
                </td>
                <td class="py-3 px-6">
                  <span class="px-4 py-1.5 bg-white text-gray-700 text-xs font-medium rounded-full uppercase border border-gray-200">
                    {{ monitor.type }}
                  </span>
                </td>
                <td class="py-3 px-6">
                  <span class="text-gray-700">{{ monitor.target }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Shared With Me Tab -->
    <div v-if="activeTab === 'shared-with-me'" class="content-section">
      <!-- Header with Clear Accepted Button -->
      <div v-if="acceptedShares.length > 0" class="flex justify-end mb-4">
        <button
          @click="clearAcceptedShares"
          class="px-4 py-2 text-gray-700 bg-white hover:bg-gray-100 rounded-lg transition-all font-medium border border-gray-200 flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          Clear Accepted
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading shares...</p>
      </div>

      <div v-else-if="receivedShares.length === 0" class="empty-state">
        <div class="w-20 h-20 bg-gradient-to-br from-pink-50 to-pink-100 rounded-full mx-auto mb-6 flex items-center justify-center">
          <svg class="w-10 h-10 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
          </svg>
        </div>
        <h3>No Shared Monitors</h3>
        <p>You don't have any monitors shared with you yet</p>
      </div>

      <div v-else class="shares-list">
        <div v-for="share in receivedShares" :key="share.id" class="share-card" :class="`status-${share.status}`">
          <div class="share-header">
            <div class="share-info">
              <h3>{{ share.monitor?.name }}</h3>
              <p class="share-from">Shared by <strong>{{ share.sharedBy?.username || share.sharedBy?.email }}</strong></p>
              <p class="share-time">{{ formatDate(share.shared_at) }}</p>
            </div>
            <div class="share-badges">
              <span class="role-badge">{{ share.role }}</span>
              <span class="status-badge" :class="share.status">{{ share.status }}</span>
            </div>
          </div>

          <div class="share-details-with-action">
            <div class="monitor-target-info">
              <span class="monitor-type-label">{{ share.monitor?.type?.toUpperCase() }}</span>
              <span class="monitor-target-label">{{ share.monitor?.target }}</span>
            </div>
            <div class="share-action-right">
              <div v-if="share.status === 'pending'" class="share-actions-inline">
                <button class="btn-accept" @click="handleAccept(share.id)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Accept
                </button>
                <button class="btn-decline" @click="handleDecline(share.id)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Decline
                </button>
              </div>
              <div v-else-if="share.status === 'accepted'" class="share-accepted-info-inline">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Accepted {{ formatDate(share.responded_at || '') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Shared By Me Tab -->
    <div v-if="activeTab === 'shared-by-me'" class="content-section">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading shares...</p>
      </div>

      <div v-else-if="sentShares.length === 0" class="empty-state">
        <div class="w-20 h-20 bg-gradient-to-br from-pink-50 to-pink-100 rounded-full mx-auto mb-6 flex items-center justify-center">
          <svg class="w-10 h-10 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </div>
        <h3>No Shared Monitors</h3>
        <p>You haven't shared any monitors yet</p>
      </div>

      <div v-else class="shares-list">
        <div v-for="share in sentShares" :key="share.id" class="share-card" :class="`status-${share.status}`">
          <div class="share-header">
            <div class="share-info">
              <h3>{{ share.monitor?.name }}</h3>
              <p class="share-to">
                Shared with 
                <strong v-if="share.sharedWithUser">{{ share.sharedWithUser.username || share.sharedWithUser.email }}</strong>
                <strong v-else-if="share.sharedWithTeam">{{ share.sharedWithTeam.name }} (Team)</strong>
              </p>
              <p class="share-time">{{ formatDate(share.shared_at) }}</p>
            </div>
            <div class="share-badges">
              <span class="role-badge">{{ share.role }}</span>
              <span class="status-badge" :class="share.status">{{ share.status }}</span>
            </div>
          </div>

          <div class="share-details-with-action">
            <div class="monitor-target-info">
              <span class="monitor-type-label">{{ share.monitor?.type?.toUpperCase() }}</span>
              <span class="monitor-target-label">{{ share.monitor?.target }}</span>
            </div>
            <div class="share-action-right">
              <button v-if="share.status !== 'declined'" class="btn-revoke" @click="handleRevoke(share.id)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Revoke Access
              </button>
              <div v-else class="share-declined-info-inline">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <span>Declined</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Share Modal -->
    <ShareMonitorModal 
      v-if="showShareModal && selectedMonitor" 
      :monitor="selectedMonitor"
      @close="closeShareModal"
      @shared="onShared"
    />

    <!-- Bulk Share Modal -->
    <BulkShareModal
      v-if="showBulkShareModal"
      :monitorIds="selectedMonitors"
      @close="closeBulkShareModal"
      @shared="onShared"
    />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useMonitorsStore } from '../stores/monitors';
import { useSharesStore } from '../stores/shares';
import { addToast } from '../composables/useToast';
import ShareMonitorModal from '../components/ShareMonitorModal.vue';
import BulkShareModal from '../components/BulkShareModal.vue';

const route = useRoute();
const monitorsStore = useMonitorsStore();
const sharesStore = useSharesStore();

const activeTab = ref<'my-monitors' | 'shared-with-me' | 'shared-by-me'>('my-monitors');
const loading = ref(false);
const showShareModal = ref(false);
const showBulkShareModal = ref(false);
const selectedMonitor = ref<any>(null);
const selectedMonitors = ref<string[]>([]);
const searchQuery = ref('');

const myMonitors = computed(() => monitorsStore.personal.monitors || []);
const receivedShares = computed(() => sharesStore.receivedShares || []);
const sentShares = computed(() => sharesStore.sentShares || []);
const pendingShares = computed(() => sharesStore.pendingReceivedShares || []);
const acceptedShares = computed(() => receivedShares.value.filter((s: any) => s.status === 'accepted'));

const filteredMonitors = computed(() => {
  if (!searchQuery.value) return myMonitors.value;
  const query = searchQuery.value.toLowerCase();
  return myMonitors.value.filter((m: any) => 
    m.name.toLowerCase().includes(query) || 
    m.target.toLowerCase().includes(query) ||
    m.type.toLowerCase().includes(query)
  );
});

function isSelected(monitorId: string) {
  return selectedMonitors.value.includes(monitorId);
}

function toggleSelect(monitorId: string) {
  const index = selectedMonitors.value.indexOf(monitorId);
  if (index > -1) {
    selectedMonitors.value.splice(index, 1);
  } else {
    selectedMonitors.value.push(monitorId);
  }
}

function toggleSelectAll() {
  if (selectedMonitors.value.length === filteredMonitors.value.length) {
    selectedMonitors.value = [];
  } else {
    selectedMonitors.value = filteredMonitors.value.map((m: any) => m.id);
  }
}

function openShareModal(monitor: any) {
  selectedMonitor.value = monitor;
  showShareModal.value = true;
}

function openBulkShareModal() {
  if (selectedMonitors.value.length === 0) return;
  showBulkShareModal.value = true;
}

function closeShareModal() {
  showShareModal.value = false;
  selectedMonitor.value = null;
}

function closeBulkShareModal() {
  showBulkShareModal.value = false;
  selectedMonitors.value = [];
}

async function onShared() {
  await sharesStore.fetchSentShares();
}

async function handleAccept(shareId: number) {
  try {
    await sharesStore.acceptShare(shareId);
    addToast('Share accepted successfully. Monitor added to your dashboard.', 'success');
    // Refetch both shares and personal monitors
    await Promise.all([
      sharesStore.fetchReceivedShares(),
      monitorsStore.fetchPersonalMonitors()
    ]);
  } catch (error: any) {
    addToast(error.message || 'Failed to accept share', 'error');
  }
}

async function handleDecline(shareId: number) {
  try {
    await sharesStore.declineShare(shareId);
    addToast('Share declined', 'info');
    await sharesStore.fetchReceivedShares();
  } catch (error: any) {
    addToast(error.message || 'Failed to decline share', 'error');
  }
}

async function handleRevoke(shareId: number) {
  try {
    await sharesStore.revokeShare(shareId);
    addToast('Share revoked successfully', 'success');
  } catch (error: any) {
    addToast(error.message || 'Failed to revoke share', 'error');
  }
}

async function clearAcceptedShares() {
  try {
    const acceptedShareIds = acceptedShares.value.map((s: any) => s.id);
    await Promise.all(acceptedShareIds.map(id => sharesStore.revokeShare(id)));
    addToast('Accepted shares cleared successfully', 'success');
    await sharesStore.fetchReceivedShares();
  } catch (error: any) {
    addToast(error.message || 'Failed to clear accepted shares', 'error');
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return 'Yesterday';
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

onMounted(async () => {
  // Check for tab query parameter
  const tabParam = route.query.tab as string;
  if (tabParam && ['my-monitors', 'shared-with-me', 'shared-by-me'].includes(tabParam)) {
    activeTab.value = tabParam as 'my-monitors' | 'shared-with-me' | 'shared-by-me';
  }

  loading.value = true;
  try {
    await Promise.all([
      monitorsStore.fetchPersonalMonitors(),
      sharesStore.fetchReceivedShares(),
      sharesStore.fetchSentShares()
    ]);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.content-section {
  min-height: 400px;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.loading-state .spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #fae7f3;
  border-top-color: #cc1389;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #6b7280;
}

.btn-share-selected {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #cc1389 0%, #a30f6e 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(204, 19, 137, 0.3);
}

.btn-share-selected:hover {
  background: linear-gradient(135deg, #b8117b 0%, #8f0d60 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(204, 19, 137, 0.4);
}

/* Custom themed checkboxes - matching Dashboard */
.checkbox-container {
  position: relative;
  display: inline-block;
  cursor: pointer;
  user-select: none;
  width: 16px;
  height: 16px;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  width: 16px;
  height: 16px;
  margin: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 16px;
  width: 16px;
  background-color: white;
  border: 2px solid #f0b8dc;
  border-radius: 3px;
  transition: all 0.2s ease;
}

.checkbox-container:hover .checkmark {
  border-color: #e89ac9;
  background: #fef7fc;
}

.checkbox-container input:checked ~ .checkmark {
  background: linear-gradient(135deg, #cc1389 0%, #a30f6e 100%);
  border-color: #cc1389;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container .checkmark:after {
  left: 4px;
  top: 1px;
  width: 4px;
  height: 7px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-container input:focus ~ .checkmark {
  box-shadow: 0 0 0 3px rgba(204, 19, 137, 0.1);
}

.btn-share-single {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #cc1389 0%, #a30f6e 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(204, 19, 137, 0.25);
}

.btn-share-single:hover {
  background: linear-gradient(135deg, #b8117b 0%, #8f0d60 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(204, 19, 137, 0.35);
}

.monitors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.monitor-card {
  background: white;
  border: 1px solid #fae7f3;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.monitor-card:hover {
  border-color: #f0b8dc;
  box-shadow: 0 8px 20px rgba(204, 19, 137, 0.15);
  transform: translateY(-4px);
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.monitor-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

/* All monitor icons use the same themed background */
.icon-http,
.icon-tcp,
.icon-ping,
.icon-smb {
  background: linear-gradient(135deg, #fae7f3 0%, #f5d0e7 100%);
  color: #cc1389;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.up { background: #d1fae5; color: #065f46; }
.status-badge.down { background: #fee2e2; color: #991b1b; }
.status-badge.pending { background: #fae7f3; color: #8f0d60; }
.status-badge.accepted { background: #fae7f3; color: #8f0d60; }
.status-badge.declined { background: #e5e7eb; color: #374151; }

.monitor-info h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.monitor-target {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  word-break: break-all;
}

.monitor-type {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 6px;
}

.monitor-actions {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn-share {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: linear-gradient(135deg, #cc1389 0%, #a30f6e 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(204, 19, 137, 0.3);
}

.btn-share:hover {
  background: linear-gradient(135deg, #b8117b 0%, #8f0d60 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(204, 19, 137, 0.4);
}

.shares-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.share-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
}

.share-card.status-pending {
  border-left: 4px solid #cc1389;
  background: white;
}

.share-card.status-accepted {
  border-left: 4px solid #cc1389;
  background: white;
}

.share-card.status-declined {
  border-left: 4px solid #6b7280;
  opacity: 0.7;
}

.share-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.share-info h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.share-from, .share-to {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.share-time {
  color: #9ca3af;
  font-size: 0.75rem;
}

.share-badges {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  background: #f3f4f6;
  color: #374151;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.share-details {
  margin-bottom: 1rem;
}

.share-details-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.share-action-right {
  margin-left: auto;
}

.monitor-target-info {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.monitor-type-label {
  padding: 0.25rem 0.5rem;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 6px;
}

.monitor-target-label {
  color: #6b7280;
  font-size: 0.875rem;
  font-family: monospace;
}

.share-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.share-actions-inline {
  display: flex;
  gap: 0.5rem;
}

.btn-accept, .btn-decline, .btn-revoke {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-accept {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-accept:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.btn-decline {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-decline:hover {
  background: #e5e7eb;
  color: #374151;
}

.btn-revoke {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-revoke:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
}

.share-accepted-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #fae7f3;
  color: #8f0d60;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
}

.share-accepted-info svg {
  flex-shrink: 0;
}

.share-accepted-info-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #fae7f3;
  color: #8f0d60;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.share-accepted-info-inline svg {
  flex-shrink: 0;
}

.share-declined-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
}

.share-declined-info svg {
  flex-shrink: 0;
}

.share-declined-info-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.share-declined-info-inline svg {
  flex-shrink: 0;
}
</style>
