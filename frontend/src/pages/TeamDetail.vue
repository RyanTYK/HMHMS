 <template>
  <div class="min-h-screen bg-white">
    <div class="max-w-7xl mx-auto px-6 py-8">
      <!-- Header -->
      <header class="mb-8">
        <div class="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <router-link to="/teams" class="hover:text-pink-600 transition-colors">Teams</router-link>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          <span class="text-gray-900 font-medium">{{ team?.name || 'Details' }}</span>
        </div>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br from-pink-100 to-pink-200 shadow-md">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cc1389" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div>
              <h1 class="text-3xl font-bold text-gray-900">{{ team?.name || 'Team Details' }}</h1>
              <p class="text-sm text-gray-600 mt-1">Manage team members and monitors</p>
            </div>
          </div>
          <div v-if="team" class="flex items-center gap-3">
            <button
              v-if="isOwner"
              @click="showEditModal = true"
              class="px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-all font-medium border border-gray-200 hover:border-gray-300"
            >
              <svg class="w-4 h-4 inline-block mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit Team
            </button>
          </div>
        </div>
      </header>

      <!-- Content -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-600"></div>
        <p class="mt-4 text-gray-600">Loading team details...</p>
      </div>

      <div v-else-if="team" class="flex flex-col gap-6">
        <!-- Top Row: Team Info and Members Side by Side -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Team Info Card -->
          <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg hover:border-pink-300 transition-all">
            <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cc1389" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </div>
              Team Information
            </h2>
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-gray-600">Team Name</label>
                <p class="mt-1 text-gray-900">{{ team.name }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-600">Created</label>
                <p class="mt-1 text-gray-900">{{ formatDate(team.created_at) }}</p>
              </div>
              <div v-if="team.description">
                <label class="text-sm font-medium text-gray-600">Description</label>
                <p class="mt-1 text-gray-900">{{ team.description }}</p>
              </div>
            </div>
          </div>

          <!-- Members Section -->
          <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg hover:border-pink-300 transition-all">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cc1389" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                Members ({{ team.members?.length || 0 }})
              </h2>
              <button
                v-if="isOwnerOrAdmin"
                @click="showAddMemberModal = true"
                class="px-4 py-2 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 text-sm"
                style="background: linear-gradient(135deg, #cc1389 0%, #a30f6e 100%); box-shadow: 0 4px 6px rgba(204, 19, 137, 0.2);"
              >
                <svg class="w-4 h-4 inline-block mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Member
              </button>
            </div>

            <div v-if="team.members && team.members.length > 0" class="overflow-x-auto max-h-64 overflow-y-auto">
              <table class="w-full text-sm">
                <thead class="bg-pink-50 sticky top-0">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                      Name
                    </th>
                    <th class="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                      Role
                    </th>
                    <th v-if="isOwnerOrAdmin" class="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="member in team.members" :key="member.id">
                    <td class="px-3 py-2">
                      <div class="font-medium text-gray-900">{{ member.user.name }}</div>
                      <div class="text-xs text-gray-600 truncate">{{ member.user.email }}</div>
                    </td>
                    <td class="px-3 py-2">
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        :class="getRoleBadgeClass(member.role)"
                      >
                        {{ member.role.toUpperCase() }}
                      </span>
                    </td>
                    <td v-if="isOwnerOrAdmin" class="px-3 py-2 text-center">
                      <div class="flex items-center justify-center gap-1">
                        <button
                          v-if="isOwner && member.role !== 'owner'"
                          @click="openChangeRoleModal(member)"
                          class="p-1.5 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all"
                          title="Change role"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          v-if="member.role !== 'owner' && (isOwner || member.user_id !== authStore.user?.id)"
                          @click="confirmRemoveMember(member)"
                          class="p-1.5 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                          title="Remove member"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="text-center py-8 text-gray-500 text-sm">
              No members yet
            </div>
          </div>
        </div>

        <!-- Team Monitors Section -->
        <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg hover:border-pink-300 transition-all">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cc1389" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </div>
              Team Monitors ({{ teamMonitors.length }})
            </h2>
            <div class="flex items-center gap-3">
              <router-link
                :to="`/teams/${team?.id}/monitors`"
                class="px-4 py-2 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-lg font-medium text-sm transition-all"
              >
                View All Monitors
              </router-link>
            </div>
          </div>

          <div v-if="teamMonitors.length > 0" class="max-h-96 overflow-y-auto">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-2">
            <div
              v-for="monitor in teamMonitors"
              :key="monitor.id"
              @click="navigateToMonitor(monitor.id)"
              class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-pink-50 hover:border-pink-300 cursor-pointer transition-all"
            >
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <div
                  class="w-2 h-2 rounded-full flex-shrink-0"
                  :class="{
                    'bg-green-500': monitor.status === 'up',
                    'bg-red-500': monitor.status === 'down',
                    'bg-gray-400': monitor.status === 'unknown' || monitor.status === 'paused'
                  }"
                ></div>
                <div class="min-w-0 flex-1">
                  <h3 class="font-medium text-gray-900 text-sm truncate">{{ monitor.name }}</h3>
                  <p class="text-xs text-gray-600 truncate">{{ monitor.target }}</p>
                </div>
              </div>
              <span
                class="px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ml-2"
                :class="{
                  'bg-green-50 text-green-700': monitor.status === 'up',
                  'bg-red-50 text-red-700': monitor.status === 'down',
                  'bg-gray-100 text-gray-700': monitor.status === 'unknown' || monitor.status === 'paused'
                }"
              >
                {{ monitor.status?.toUpperCase() }}
              </span>
            </div>
            </div>
          </div>

          <div v-else class="text-center py-8 text-gray-500">
            No monitors assigned to this team yet
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Team Modal -->
    <TeamModal
      v-if="showEditModal && team"
      :team="team"
      @close="showEditModal = false"
      @updated="handleTeamUpdated"
    />

    <!-- Add Member Modal -->
    <AddMemberModal
      v-if="showAddMemberModal && team"
      :team-id="team.id"
      @close="showAddMemberModal = false"
      @added="handleMemberAdded"
    />

    <!-- Change Role Modal -->
    <ChangeRoleModal
      v-if="showChangeRoleModal && selectedMember && team"
      :team-id="team.id"
      :member="selectedMember"
      @close="showChangeRoleModal = false"
      @updated="handleRoleChanged"
    />

    <!-- Confirm Remove Member Modal -->
    <ConfirmModal
      v-if="showRemoveMemberConfirm && memberToRemove"
      title="Remove Member"
      :message="`Are you sure you want to remove ${memberToRemove.user.name} from this team?`"
      confirm-text="Remove"
      confirm-class="danger"
      @confirm="removeMember"
      @cancel="showRemoveMemberConfirm = false"
    />

    <!-- Add Team Monitor Modal -->
    <TeamMonitorForm
      v-if="showAddMonitorModal && team"
      :team-id="team.id"
      @close="showAddMonitorModal = false"
      @submit="handleMonitorSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTeamsStore, type TeamMember } from '../stores/teams';
import { useAuthStore } from '../stores/auth';
import TeamModal from '../components/TeamModal.vue';
import AddMemberModal from '../components/AddMemberModal.vue';
import ChangeRoleModal from '../components/ChangeRoleModal.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import TeamMonitorForm from '../components/TeamMonitorForm.vue';
import { useToast } from '../composables/useToast';

const route = useRoute();
const router = useRouter();
const teamsStore = useTeamsStore();
const authStore = useAuthStore();
const toast = useToast();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const loading = ref(false);
const showEditModal = ref(false);
const showAddMemberModal = ref(false);
const showChangeRoleModal = ref(false);
const showRemoveMemberConfirm = ref(false);
const showAddMonitorModal = ref(false);
const selectedMember = ref<TeamMember | null>(null);
const memberToRemove = ref<TeamMember | null>(null);
const teamMonitors = ref<any[]>([]);

const team = computed(() => teamsStore.currentTeam);

const isOwner = computed(() => {
  if (!team.value || !authStore.user) return false;
  // Check both owner_id field and member role
  if (team.value.owner_id === authStore.user.id) return true;
  const member = team.value.members?.find((m) => m.user_id === authStore.user?.id);
  return member?.role === 'owner';
});

const isOwnerOrAdmin = computed(() => {
  if (!team.value || !authStore.user) return false;
  if (isOwner.value) return true;
  const member = team.value.members?.find((m) => m.user_id === authStore.user?.id);
  return member?.role === 'admin';
});

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case 'owner':
      return 'bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800 border border-pink-300 shadow-sm';
    case 'admin':
      return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300 shadow-sm';
    default:
      return 'bg-gray-50 text-gray-700 border border-gray-300 shadow-sm';
  }
};

const navigateToMonitor = (monitorId: number) => {
  router.push(`/teams/${team.value?.id}/monitors/${monitorId}`);
};

const openChangeRoleModal = (member: TeamMember) => {
  selectedMember.value = member;
  showChangeRoleModal.value = true;
};

const confirmRemoveMember = (member: TeamMember) => {
  memberToRemove.value = member;
  showRemoveMemberConfirm.value = true;
};

const handleTeamUpdated = async () => {
  showEditModal.value = false;
  const teamId = parseInt(route.params.id as string);
  await teamsStore.fetchTeamById(teamId);
};

const handleMemberAdded = async () => {
  showAddMemberModal.value = false;
  const teamId = parseInt(route.params.id as string);
  await teamsStore.fetchTeamById(teamId);
};

const handleRoleChanged = async () => {
  showChangeRoleModal.value = false;
  selectedMember.value = null;
  const teamId = parseInt(route.params.id as string);
  await teamsStore.fetchTeamById(teamId);
};

const removeMember = async () => {
  if (!memberToRemove.value || !team.value) return;
  
  try {
    await teamsStore.removeMember(team.value.id, memberToRemove.value.user_id);
    showRemoveMemberConfirm.value = false;
    memberToRemove.value = null;
  } catch (error) {
    console.error('Failed to remove member:', error);
  }
};

const handleMonitorSubmit = async (monitorData: any) => {
  if (!team.value) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/teams/${team.value.id}/monitors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(monitorData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create monitor');
    }

    const result = await response.json();
    if (result.success) {
      toast.add('Team monitor created successfully', 'success');
      showAddMonitorModal.value = false;
      
      // Refresh team monitors
      teamMonitors.value = await teamsStore.getTeamMonitors(team.value.id);
    }
  } catch (error: any) {
    console.error('Failed to create team monitor:', error);
    toast.add(error.message || 'Failed to create monitor', 'error');
  }
};

onMounted(async () => {
  const teamId = parseInt(route.params.id as string);
  if (!teamId) {
    router.push('/teams');
    return;
  }

  loading.value = true;
  try {
    await teamsStore.fetchTeamById(teamId);
    teamMonitors.value = await teamsStore.getTeamMonitors(teamId);
  } catch (error) {
    console.error('Failed to load team:', error);
    router.push('/teams');
  } finally {
    loading.value = false;
  }
});
</script>
