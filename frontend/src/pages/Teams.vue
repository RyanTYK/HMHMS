<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-7xl mx-auto px-6 py-8">
      <!-- Header -->
      <header class="mb-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Teams</h1>
            <p class="text-gray-600">Manage your teams and collaborate with team members</p>
          </div>
        </div>
      </header>

      <!-- Actions and Search Bar -->
      <div v-if="teamsStore.teams.length > 0" class="flex justify-between items-center mb-6 gap-4">
        <div class="flex items-center gap-3">
          <button
            v-if="editMode && selectedTeams.length > 0"
            @click="confirmBulkDelete"
            class="px-4 py-2 text-white bg-[#cc1389] hover:bg-[#b8117b] rounded-lg transition-all font-medium flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete ({{ selectedTeams.length }})
          </button>
          <button 
            @click="toggleEditMode"
            :class="[
              'flex items-center justify-center w-10 h-10 bg-white border rounded-lg transition-all',
              editMode 
                ? 'bg-pink-50 border-pink-500 text-pink-600' 
                : 'border-gray-300 text-gray-600 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-300'
            ]"
            :title="editMode ? 'Cancel Edit Mode' : 'Edit Mode'"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            @click="showCreateModal = true"
            class="px-4 py-2 text-gray-700 bg-white hover:bg-gray-100 rounded-lg transition-all font-medium border border-gray-200 flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Team
          </button>
        </div>
        <div class="relative flex-1 max-w-md">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search teams..."
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

      <!-- Teams Table -->
      <div v-if="!loading && filteredTeams.length > 0" class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead style="background-color: white !important;" class="border-b-2 border-[#cc1389]">
              <tr>
                <th class="text-left py-3 px-6 font-medium text-[#7a0b52] text-xs uppercase tracking-wide">
                  Team Name
                </th>
                <th class="text-left py-3 px-6 font-medium text-[#7a0b52] text-xs uppercase tracking-wide">
                  Members
                </th>
                <th class="text-left py-3 px-6 font-medium text-[#7a0b52] text-xs uppercase tracking-wide">
                  Monitors
                </th>
                <th class="text-left py-3 px-6 font-medium text-[#7a0b52] text-xs uppercase tracking-wide">
                  Created On
                </th>
                <th v-if="!editMode" class="text-left py-3 px-6 font-medium text-[#7a0b52] text-xs uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="team in filteredTeams"
                :key="team.id"
                @click="handleRowClick(team)"
                :class="[
                  'border-b border-[#f0b8dc] transition-colors cursor-pointer',
                  editMode && selectedTeams.includes(team.id) 
                    ? 'bg-pink-50 shadow-inner' 
                    : 'hover:bg-[#fae7f3]'
                ]"
              >
                <td class="py-3 px-6">
                  <div class="flex items-center gap-3">
                    <div v-if="editMode" class="flex-shrink-0">
                      <div 
                        :class="[
                          'w-5 h-5 rounded flex items-center justify-center border-2 transition-all',
                          selectedTeams.includes(team.id) 
                            ? 'bg-pink-600 border-pink-600' 
                            : 'border-gray-300 bg-white'
                        ]"
                      >
                        <svg v-if="selectedTeams.includes(team.id)" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-pink-100 to-pink-200">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cc1389" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </div>
                    <div>
                      <h4 class="font-medium text-gray-900">{{ team.name }}</h4>
                      <span v-if="team.description" class="text-sm text-gray-500 truncate-description block">{{ team.description }}</span>
                    </div>
                  </div>
                </td>
                <td class="py-3 px-6">
                  <span class="text-gray-700">{{ team.memberCount || team.members?.length || 0 }}</span>
                </td>
                <td class="py-3 px-6">
                  <span class="text-gray-700">{{ team.monitorCount || 0 }}</span>
                </td>
                <td class="py-3 px-6">
                  <span class="text-gray-700">{{ formatDate(team.created_at) }}</span>
                </td>
                <td v-if="!editMode" class="py-3 px-6" @click.stop>
                  <div class="flex items-center gap-1">
                    <button
                      @click="editTeam(team)"
                      class="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-all"
                      title="Edit Team"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      @click="confirmDelete(team)"
                      class="p-1.5 text-gray-600 hover:bg-red-50 rounded transition-all"
                      title="Delete Team"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!loading && filteredTeams.length === 0"
        class="p-12 text-center"
      >
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center">
          <svg class="w-10 h-10 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          {{ searchQuery ? 'No teams found' : 'No teams yet' }}
        </h3>
        <p class="text-gray-600 mb-6">
          {{ searchQuery ? 'Try adjusting your search query' : 'Create your first team to get started' }}
        </p>
        <button
          v-if="!searchQuery"
          @click="showCreateModal = true"
          class="px-4 py-2 text-gray-700 bg-white hover:bg-gray-100 rounded-lg transition-all font-medium border border-gray-200"
        >
          Create Team
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-600"></div>
        <p class="mt-4 text-gray-600">Loading teams...</p>
      </div>
    </div>

    <!-- Create/Edit Team Modal -->
    <TeamModal
      v-if="showCreateModal || showEditModal"
      :team="editingTeam"
      @close="closeModals"
      @created="handleTeamCreated"
      @updated="handleTeamUpdated"
    />




    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-if="showDeleteModal"
      title="Delete Team"
      :message="`Are you sure you want to delete '${deletingTeam?.name}'? This action cannot be undone.`"
      confirmText="Delete"
      confirmClass="danger"
      :showCancel="true"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />

    <ConfirmModal
      v-if="showOwnerErrorModal"
      title="Delete Team"
      :message="'Only the team owner can delete this team.'"
      :confirmText="'Okay'"
      :confirmClass="'default'"
      :showCancel="false"
      :hideWarning="true"
      @confirm="showOwnerErrorModal = false"
    />

    <ConfirmModal
      v-if="showBulkDeleteModal"
      title="Delete Teams"
      :message="`Are you sure you want to delete ${selectedTeams.length} team(s)? This action cannot be undone.`"
      confirmText="Delete All"
      confirmClass="danger"
      :showCancel="true"
      @confirm="handleBulkDelete"
      @cancel="showBulkDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useTeamsStore, type Team } from '../stores/teams';
import TeamModal from '../components/TeamModal.vue';
import ConfirmModal from '../components/ConfirmModal.vue';

const router = useRouter();
const teamsStore = useTeamsStore();

const searchQuery = ref('');
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const showBulkDeleteModal = ref(false);
const showOwnerErrorModal = ref(false);
const editingTeam = ref<Team | undefined>(undefined);
const deletingTeam = ref<Team | undefined>(undefined);
const activeMenuId = ref<number | null>(null);
const loading = ref(false);
const editMode = ref(false);
const selectedTeams = ref<number[]>([]);

const filteredTeams = computed(() => {
  if (!searchQuery.value) {
    return teamsStore.teams;
  }
  const query = searchQuery.value.toLowerCase();
  return teamsStore.teams.filter((team) =>
    team.name.toLowerCase().includes(query) ||
    team.description?.toLowerCase().includes(query)
  );
});

const navigateToTeam = (teamId: number) => {
  router.push(`/teams/${teamId}`);
};

const toggleTeamMenu = (teamId: number) => {
  activeMenuId.value = activeMenuId.value === teamId ? null : teamId;
};

const closeMenus = () => {
  activeMenuId.value = null;
};

const editTeam = (team: Team) => {
  editingTeam.value = team;
  showEditModal.value = true;
  activeMenuId.value = null;
};

const confirmDelete = (team: Team) => {
  deletingTeam.value = team;
  showDeleteModal.value = true;
  activeMenuId.value = null;
};

const handleDelete = async () => {
  if (!deletingTeam.value) return;

  try {
    await teamsStore.deleteTeam(deletingTeam.value.id);
    showDeleteModal.value = false;
    deletingTeam.value = undefined;
    await teamsStore.fetchTeams();
  } catch (error: any) {
    if (error?.message?.toLowerCase().includes('insufficient permissions') || error?.message?.toLowerCase().includes('owner')) {
      showDeleteModal.value = false;
      showOwnerErrorModal.value = true;
    } else {
      alert('Failed to delete team.');
      showDeleteModal.value = false;
    }
    deletingTeam.value = undefined;
  }
};

const closeModals = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  editingTeam.value = undefined;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getTeamColor = (id: number) => {
  const colors = [
    '#3b82f6', // blue
    '#6b7280', // gray
    '#8b5cf6', // purple
    '#10b981', // green
    '#ef4444', // red
    '#f59e0b', // amber
    '#ec4899', // pink
    '#06b6d4', // cyan
  ];
  return colors[id % colors.length];
};

const handleTeamCreated = () => {
  closeModals();
  teamsStore.fetchTeams();
};

const handleTeamUpdated = () => {
  closeModals();
  teamsStore.fetchTeams();
};

const handleRowClick = (team: Team) => {
  if (editMode.value) {
    toggleTeamSelection(team.id);
  } else {
    navigateToTeam(team.id);
  }
};

const toggleEditMode = () => {
  editMode.value = !editMode.value;
  if (!editMode.value) {
    selectedTeams.value = [];
  }
};

const toggleTeamSelection = (teamId: number) => {
  const index = selectedTeams.value.indexOf(teamId);
  if (index > -1) {
    selectedTeams.value.splice(index, 1);
  } else {
    selectedTeams.value.push(teamId);
  }
};

const toggleSelectAll = () => {
  if (selectedTeams.value.length === filteredTeams.value.length) {
    selectedTeams.value = [];
  } else {
    selectedTeams.value = filteredTeams.value.map(t => t.id);
  }
};

const confirmBulkDelete = () => {
  showBulkDeleteModal.value = true;
};

const handleBulkDelete = async () => {
  if (selectedTeams.value.length === 0) return;

  try {
    const deletePromises = selectedTeams.value.map(teamId => 
      teamsStore.deleteTeam(teamId)
    );
    
    await Promise.allSettled(deletePromises);
    
    showBulkDeleteModal.value = false;
    selectedTeams.value = [];
    editMode.value = false;
    await teamsStore.fetchTeams();
  } catch (error: any) {
    console.error('Error deleting teams:', error);
    showBulkDeleteModal.value = false;
  }
};

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('button')) {
    closeMenus();
  }
};

onMounted(async () => {
  loading.value = true;
  try {
    await teamsStore.fetchTeams();
  } finally {
    loading.value = false;
  }
  
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* Truncate descriptions to prevent long scrolling */
.truncate-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;
}

/* Custom themed checkboxes - matching SharedMonitors */
input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border: 2px solid #f0b8dc;
  border-radius: 3px;
  background: white;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

input[type="checkbox"]:hover {
  border-color: #e89ac9;
  background: #fef7fc;
}

input[type="checkbox"]:checked {
  background: linear-gradient(135deg, #cc1389 0%, #a30f6e 100%);
  border-color: #cc1389;
}

input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 7px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

input[type="checkbox"]:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(204, 19, 137, 0.1);
}
</style>
