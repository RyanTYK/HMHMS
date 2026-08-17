<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <!-- Header -->
      <div class="modal-header">
        <div class="modal-title-section">
          <h2>{{ isEditMode ? 'Edit Team' : 'Create New Team' }}</h2>
          <p class="modal-subtitle">Configure your team settings and members</p>
        </div>
        <button class="close-btn" @click="$emit('close')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <!-- Basic Info Section -->
          <div class="section">
            <h3 class="section-title">Basic Info</h3>
            
            <div class="form-row">
              <div class="form-group full-width">
                <label for="teamName">Team Name</label>
                <input 
                  type="text" 
                  id="teamName" 
                  v-model="formData.name" 
                  placeholder="Enter team name"
                  maxlength="100"
                  required
                />
                <span class="char-count">{{ formData.name.length }}/100</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group full-width">
                <label for="description">Description <span style="color: #9ca3af;">(optional)</span></label>
                <textarea 
                  id="description" 
                  v-model="formData.description" 
                  placeholder="Enter team description"
                  rows="3"
                  maxlength="500"
                  style="resize: none;"
                ></textarea>
                <span class="char-count">{{ formData.description.length }}/500</span>
              </div>
            </div>
          </div>

          <!-- Team Members Section (only show when creating) -->
          <div class="section" v-if="!isEditMode">
            <h3 class="section-title">Team Members</h3>
            
            <div class="form-row">
              <div class="form-group full-width">
                <label for="userSearch">Add Members <span style="color: #9ca3af;">(optional)</span></label>
                <div class="user-search-container">
                  <input 
                    type="text" 
                    id="userSearch" 
                    v-model="userSearchQuery" 
                    placeholder="Search users by name or email..."
                    class="user-search-input"
                    @input="handleUserSearchInput"
                    @keydown.down.prevent="navigateDown"
                    @keydown.up.prevent="navigateUp"
                    @keydown.enter.prevent="selectHighlighted"
                    @keydown.esc="clearUserSearch"
                  />
                  <div v-if="userSearchQuery && filteredAvailableUsers.length > 0" class="user-dropdown">
                    <div 
                      v-for="(user, index) in filteredAvailableUsers" 
                      :key="user.id" 
                      :class="['user-dropdown-item', { 'highlighted': index === highlightedIndex }]"
                      @click="addMemberByUser(user)"
                      @mouseenter="highlightedIndex = index"
                    >
                      <div class="user-dropdown-name">{{ user.name }}</div>
                      <div class="user-dropdown-email">{{ user.email }}</div>
                    </div>
                  </div>
                  <div v-if="userSearchQuery && filteredAvailableUsers.length === 0" class="user-dropdown">
                    <div class="user-dropdown-empty">No users found</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Selected Members List -->
            <div v-if="formData.members.length > 0" class="members-list">
              <div v-for="member in formData.members" :key="member.user_id" class="member-item">
                <div class="member-info">
                  <span class="member-bullet">●</span>
                  <div class="member-details">
                    <span class="member-name">{{ member.user.name }}</span>
                    <span class="member-email">{{ member.user.email }}</span>
                  </div>
                </div>
                <div class="member-actions">
                  <select 
                    v-model="member.role" 
                    class="role-select"
                    @click.stop
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button 
                    type="button"
                    class="member-remove" 
                    @click="removeMember(member.user_id)"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <div class="modal-footer-left">
          <button 
            v-if="isEditMode"
            type="button" 
            class="btn btn-delete" 
            @click="showDeleteConfirm = true"
            :disabled="loading"
          >
            <svg class="w-4 h-4 inline-block mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Delete Team
          </button>
        </div>
        <div class="modal-footer-right">
          <button type="button" class="btn btn-cancel" @click="$emit('close')">
            Cancel
          </button>
          <button 
            type="submit" 
            class="btn btn-create" 
            @click.prevent="handleSubmit"
            :disabled="loading"
          >
            {{ loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Team' : 'Create Team') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <ConfirmModal
      v-if="showDeleteConfirm"
      title="Delete Team"
      :message="`Are you sure you want to delete ${props.team?.name}? This action cannot be undone.`"
      confirm-text="Delete"
      confirm-class="danger"
      @confirm="deleteTeam"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTeamsStore, type Team } from '../stores/teams';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import ConfirmModal from './ConfirmModal.vue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Props {
  team?: Team;
}

interface User {
  id: number;
  email: string;
  name: string;
}

interface TeamMemberForm {
  user_id: number;
  user: User;
  role: 'admin' | 'member';
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  created: [team: Team];
  updated: [team: Team];
}>();

const teamsStore = useTeamsStore();
const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

const isEditMode = computed(() => !!props.team);
const showDeleteConfirm = ref(false);

const formData = reactive({
  name: '',
  description: '',
  members: [] as TeamMemberForm[],
});

const allUsers = ref<User[]>([]);
const selectedUserId = ref('');
const userSearchQuery = ref('');
const highlightedIndex = ref(0);
const loading = ref(false);
const errorMessage = ref('');

const availableUsers = computed(() => {
  const addedUserIds = new Set(formData.members.map(m => m.user_id));
  return allUsers.value.filter(user => !addedUserIds.has(user.id));
});

const filteredAvailableUsers = computed(() => {
  if (!userSearchQuery.value.trim()) return [];
  const query = userSearchQuery.value.toLowerCase().trim();
  
  // Filter and score users with smart ranking
  const scored = availableUsers.value
    .map(user => {
      const emailLower = user.email.toLowerCase();
      const nameLower = user.name.toLowerCase();
      let score = 0;
      
      // Exact matches get highest priority
      if (emailLower === query) score += 1000;
      if (nameLower === query) score += 900;
      
      // Starts with gets high priority
      if (emailLower.startsWith(query)) score += 100;
      if (nameLower.startsWith(query)) score += 90;
      
      // Contains gets lower priority
      if (emailLower.includes(query)) score += 10;
      if (nameLower.includes(query)) score += 9;
      
      return { user, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.user)
    .slice(0, 10); // Limit to 10 results
  
  return scored;
});

const fetchAllUsers = async () => {
  try {
    const token = authStore.token;
    if (!token) {
      console.error('No auth token available');
      return;
    }

    const response = await fetch(`${API_URL}/api/auth/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch users');
    }

    const data = await response.json();
    allUsers.value = data.success ? (data.users || []) : (Array.isArray(data) ? data : []);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    errorMessage.value = error.message || 'Failed to load users';
  }
};

const addMember = () => {
  if (!selectedUserId.value) return;
  highlightedIndex.value = 0;
};

// Keyboard navigation handlers
const handleUserSearchInput = () => {
  highlightedIndex.value = 0;
};

const navigateDown = () => {
  if (highlightedIndex.value < filteredAvailableUsers.value.length - 1) {
    highlightedIndex.value++;
  }
};

const navigateUp = () => {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--;
  }
};

const selectHighlighted = () => {
  const user = filteredAvailableUsers.value[highlightedIndex.value];
  if (user) {
    addMemberByUser(user);
  }
};

const clearUserSearch = () => {
  userSearchQuery.value = '';
  highlightedIndex.value = 0;
  
  const userId = parseInt(selectedUserId.value);
  const user = allUsers.value.find(u => u.id === userId);
  
  if (user && !formData.members.find(m => m.user_id === userId)) {
    formData.members.push({
      user_id: userId,
      user: user,
      role: 'member',
    });
  }
  
  selectedUserId.value = '';
};

const addMemberByUser = (user: User) => {
  if (!formData.members.find(m => m.user_id === user.id)) {
    formData.members.push({
      user_id: user.id,
      user: user,
      role: 'member',
    });
  }
  userSearchQuery.value = '';
};

const removeMember = (userId: number) => {
  const index = formData.members.findIndex(m => m.user_id === userId);
  if (index > -1) {
    formData.members.splice(index, 1);
  }
};

const handleSubmit = async () => {
  errorMessage.value = '';
  
  if (!formData.name.trim()) {
    errorMessage.value = 'Team name is required';
    return;
  }
  
  if (formData.name.trim().length < 2) {
    errorMessage.value = 'Team name must be at least 2 characters';
    return;
  }

  loading.value = true;
  
  try {
    if (isEditMode.value && props.team) {
      const updated = await teamsStore.updateTeam(props.team.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      
      if (updated) {
        emit('updated', updated);
      }
    } else {
      // Create team with initial members
      const created = await teamsStore.createTeam({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      
      if (created) {
        console.log('Team created successfully:', created);
        console.log('Members to add:', formData.members);
        
        // Add members to the newly created team
        if (formData.members.length > 0) {
          const addMemberResults = [];
          for (const member of formData.members) {
            const user = allUsers.value.find(u => u.id === member.user_id);
            if (user) {
              try {
                console.log(`Adding member: ${user.email} as ${member.role}`);
                await teamsStore.addMember(created.id, user.email, member.role);
                console.log('Member added successfully');
                addMemberResults.push({ user: user.email, success: true });
              } catch (error: any) {
                console.error(`Error adding member ${user.email}:`, error);
                addMemberResults.push({ user: user.email, success: false, error: error.message });
                // Continue adding other members even if one fails
              }
            }
          }
          console.log('Add members complete:', addMemberResults);
        }
        
        // Refresh teams list to show updated member count
        await teamsStore.fetchTeams();
        emit('created', created);
      }
    }
  } catch (error: any) {
    errorMessage.value = error.response?.data?.error || teamsStore.error || 'Failed to save team';
  } finally {
    loading.value = false;
  }
};

const deleteTeam = async () => {
  if (!props.team) return;
  
  try {
    loading.value = true;
    await teamsStore.deleteTeam(props.team.id);
    showDeleteConfirm.value = false;
    emit('close');
    toast.add('Team deleted successfully', 'success');
    router.push('/teams');
  } catch (error) {
    console.error('Failed to delete team:', error);
    toast.add('Failed to delete team', 'error');
    showDeleteConfirm.value = false;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchAllUsers();
  
  if (props.team) {
    formData.name = props.team.name;
    formData.description = props.team.description || '';
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 9999;
}

.modal {
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(204, 19, 137, 0.2);
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
  border: 1px solid #fae7f3;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 24px 20px;
  border-bottom: 1px solid #fae7f3;
  background: linear-gradient(135deg, #fae7f3 0%, #ffffff 100%);
  border-radius: 16px 16px 0 0;
}

.modal-title-section h2 {
  font-size: 20px;
  font-weight: 700;
  color: #8f0d60;
  margin: 0 0 4px 0;
}

.modal-subtitle {
  font-size: 14px;
  color: #a30f6e;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #a30f6e;
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #f5d0e7;
  color: #cc1389;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.section {
  margin-bottom: 24px;
}

.section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #8f0d60;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #fae7f3;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: #8f0d60;
  margin-bottom: 6px;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 12px;
  border: 1px solid #f0b8dc;
  border-radius: 8px;
  font-size: 14px;
  color: #3d0629;
  background: white;
  transition: all 0.2s;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #cc1389;
  box-shadow: 0 0 0 3px rgba(204, 19, 137, 0.1);
}

.form-group input::placeholder,
.form-group select::placeholder,
.form-group textarea::placeholder {
  color: #e089c4;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 11px;
  color: #a30f6e;
  margin-top: 4px;
}

.member-selector select {
  width: 100%;
}

.user-search-container {
  position: relative;
}

.user-search-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #f0b8dc;
  border-radius: 8px;
  font-size: 14px;
  color: #3d0629;
  background: white;
  transition: all 0.2s;
}

.user-search-input:focus {
  outline: none;
  border-color: #cc1389;
  box-shadow: 0 0 0 3px rgba(204, 19, 137, 0.1);
}

.user-dropdown-item.highlighted {
  background: rgba(250, 231, 243, 0.6);
}

.user-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #f0b8dc;
  border-radius: 8px;
  margin-top: 4px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(204, 19, 137, 0.15);
  z-index: 10;
}

.user-dropdown-item {
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #fae7f3;
  transition: all 0.2s;
}

.user-dropdown-item:last-child {
  border-bottom: none;
}

.user-dropdown-item:hover {
  background: rgba(250, 231, 243, 0.6);
}

.user-dropdown-name {
  font-size: 14px;
  font-weight: 500;
  color: #3d0629;
  margin-bottom: 2px;
}

.user-dropdown-email {
  font-size: 12px;
  color: #a30f6e;
}

.user-dropdown-empty {
  padding: 12px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: rgba(250, 231, 243, 0.5);
  border-radius: 8px;
  border: 1px solid #f5d0e7;
  transition: all 0.2s;
}

.member-item:hover {
  background: rgba(245, 208, 231, 0.6);
  border-color: #eba1d0;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.member-bullet {
  color: #cc1389;
  font-size: 10px;
}

.member-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.member-name {
  font-size: 14px;
  font-weight: 500;
  color: #3d0629;
}

.member-email {
  font-size: 12px;
  color: #a30f6e;
}

.member-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-select {
  padding: 6px 10px;
  border: 1px solid #f0b8dc;
  border-radius: 6px;
  font-size: 12px;
  color: #8f0d60;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.role-select:focus {
  outline: none;
  border-color: #cc1389;
  box-shadow: 0 0 0 2px rgba(204, 19, 137, 0.1);
}

.member-remove {
  background: none;
  border: none;
  color: #e089c4;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 0.2s;
  line-height: 1;
}

.member-remove:hover {
  color: #cc1389;
}

.error-message {
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
  margin-top: 16px;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #fae7f3;
  background: linear-gradient(135deg, #fae7f3 0%, #ffffff 100%);
  border-radius: 0 0 16px 16px;
}

.modal-footer-left {
  display: flex;
  gap: 12px;
}

.modal-footer-right {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  background: white;
  color: #a30f6e;
  border: 1px solid #f0b8dc;
}

.btn-cancel:hover {
  background: #fae7f3;
  color: #8f0d60;
  border-color: #eba1d0;
}

.btn-delete {
  background: linear-gradient(135deg, #8f0d60 0%, #7a0b52 100%);
  color: white;
  box-shadow: 0 4px 6px rgba(143, 13, 96, 0.3);
}

.btn-delete:hover:not(:disabled) {
  background: linear-gradient(135deg, #7a0b52 0%, #660a45 100%);
  box-shadow: 0 6px 10px rgba(143, 13, 96, 0.4);
  transform: translateY(-1px);
}

.btn-create {
  background: linear-gradient(135deg, #cc1389 0%, #a30f6e 100%);
  color: white;
  box-shadow: 0 4px 6px rgba(204, 19, 137, 0.2);
}

.btn-create:hover:not(:disabled) {
  background: linear-gradient(135deg, #b8117b 0%, #8f0d60 100%);
  box-shadow: 0 6px 10px rgba(204, 19, 137, 0.3);
  transform: translateY(-1px);
}
</style>
