<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <!-- Header -->
      <div class="modal-header">
        <div class="modal-title-section">
          <h2>Add Member</h2>
          <p class="modal-subtitle">Invite a team member by email</p>
        </div>
        <button class="close-btn" @click="$emit('close')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Form Body -->
      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <div class="section">
            <h3 class="section-title">Member Information</h3>
            
            <!-- Email -->
            <div class="form-group">
              <label for="memberEmail">Email Address</label>
              <div class="autocomplete-wrapper">
                <input
                  id="memberEmail"
                  v-model="formData.email"
                  type="email"
                  required
                  placeholder="Type to search users..."
                  class="form-input"
                  @input="handleEmailInput"
                  @focus="showDropdown = true"
                  @blur="handleBlur"
                  @keydown.down.prevent="navigateDown"
                  @keydown.up.prevent="navigateUp"
                  @keydown.enter.prevent="selectHighlighted"
                  @keydown.esc="showDropdown = false"
                />
                
                <!-- Autocomplete Dropdown -->
                <div v-if="showDropdown && filteredUsers.length > 0" class="user-dropdown">
                  <div 
                    v-for="(user, index) in filteredUsers" 
                    :key="user.id"
                    :class="['user-dropdown-item', { 'highlighted': index === highlightedIndex }]"
                    @mousedown.prevent="selectUser(user)"
                    @mouseenter="highlightedIndex = index"
                  >
                    <div class="user-info">
                      <div class="user-name">{{ user.name }}</div>
                      <div class="user-email">{{ user.email }}</div>
                    </div>
                    <svg class="user-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                </div>
                
                <!-- No results message -->
                <div v-if="showDropdown && formData.email && filteredUsers.length === 0 && !isSearching" class="no-results">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <span>No users found</span>
                </div>
              </div>
            </div>

            <!-- Role -->
            <div class="form-group">
              <label for="memberRole">Role</label>
              <div class="custom-select-wrapper">
                <div 
                  class="custom-select"
                  @click="toggleRoleDropdown"
                  tabindex="0"
                  @keydown.enter.prevent="toggleRoleDropdown"
                  @keydown.space.prevent="toggleRoleDropdown"
                  @keydown.esc="showRoleDropdown = false"
                  @blur="handleRoleBlur"
                >
                  <span class="selected-value">{{ formData.role === 'admin' ? 'Admin' : 'Member' }}</span>
                  <svg class="dropdown-arrow" :class="{ 'open': showRoleDropdown }" width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div v-if="showRoleDropdown" class="role-dropdown">
                  <div 
                    class="role-option"
                    :class="{ 'selected': formData.role === 'member' }"
                    @mousedown.prevent="selectRole('member')"
                  >
                    <span>Member</span>
                    <svg v-if="formData.role === 'member'" class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <div 
                    class="role-option"
                    :class="{ 'selected': formData.role === 'admin' }"
                    @mousedown.prevent="selectRole('admin')"
                  >
                    <span>Admin</span>
                    <svg v-if="formData.role === 'admin'" class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
              <p class="helper-text">
                <svg class="inline-block w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                Admins can add/remove members and manage team monitors
              </p>
            </div>

            <!-- Error Message -->
            <div v-if="errorMessage" class="error-message">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{{ errorMessage }}</span>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button type="button" class="btn btn-cancel" @click="$emit('close')">
          Cancel
        </button>
        <button type="submit" class="btn btn-create" @click="handleSubmit" :disabled="loading">
          <svg v-if="!loading" class="inline-block w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span v-if="loading">Adding...</span>
          <span v-else>Add Member</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useTeamsStore } from '../stores/teams';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Props {
  teamId: number;
}

interface User {
  id: number;
  name: string;
  email: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  added: [];
}>();

const teamsStore = useTeamsStore();

const formData = reactive({
  email: '',
  role: 'member' as 'member' | 'admin',
});

const loading = ref(false);
const errorMessage = ref('');

// Autocomplete state
const availableUsers = ref<User[]>([]);
const showDropdown = ref(false);
const highlightedIndex = ref(0);
const isSearching = ref(false);
const showRoleDropdown = ref(false);

// Fetch available users
async function fetchUsers() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/auth/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (data.success) {
      availableUsers.value = data.users || [];
    }
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
}

// Smart filtering with ranking
const filteredUsers = computed(() => {
  if (!formData.email || formData.email.trim() === '') return [];
  const query = formData.email.toLowerCase().trim();
  
  // Filter and score users
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
    .slice(0, 5); // Limit to 5 results
  
  return scored;
});

// Autocomplete handlers
function handleEmailInput() {
  showDropdown.value = true;
  highlightedIndex.value = 0;
}

function handleBlur() {
  // Delay to allow click on dropdown
  setTimeout(() => {
    showDropdown.value = false;
  }, 200);
}

function selectUser(user: User) {
  formData.email = user.email;
  showDropdown.value = false;
}

function navigateDown() {
  if (highlightedIndex.value < filteredUsers.value.length - 1) {
    highlightedIndex.value++;
  }
}

function navigateUp() {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--;
  }
}

function selectHighlighted() {
  const user = filteredUsers.value[highlightedIndex.value];
  if (user) {
    selectUser(user);
  }
}
// Role dropdown handlers
function toggleRoleDropdown() {
  showRoleDropdown.value = !showRoleDropdown.value;
}

function selectRole(role: 'member' | 'admin') {
  formData.role = role;
  showRoleDropdown.value = false;
}

function handleRoleBlur() {
  setTimeout(() => {
    showRoleDropdown.value = false;
  }, 200);
}


const handleSubmit = async () => {
  errorMessage.value = '';
  loading.value = true;
  
  try {
    await teamsStore.addMember(props.teamId, formData.email, formData.role);
    emit('added');
  } catch (error: any) {
    errorMessage.value = error.response?.data?.error || teamsStore.error || 'Failed to add member';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
/* Color Theme Variables - Matching MonitorForm */
:root {
  --brand-primary: #cc1389;
  --brand-hover: #b8117b;
  --brand-active: #a30f6e;
  --brand-light: #fae7f3;
  --brand-lighter: #f5d0e7;
  --brand-medium: #e689c4;
  --brand-dark: #8f0d60;
  --brand-darker: #7a0b52;
}

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
  max-width: 500px;
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

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: #8f0d60;
  margin-bottom: 6px;
}

.form-input {
  padding: 10px 12px;
  border: 1px solid #f0b8dc;
  border-radius: 8px;
  font-size: 14px;
  color: #3d0629;
  background: white;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #cc1389;
  box-shadow: 0 0 0 3px rgba(204, 19, 137, 0.1);
}

.form-input:hover {
  border-color: #eba1d0;
  background-color: #fef9fc;
}

.custom-select-wrapper {
  position: relative;
}

.custom-select {
  padding: 8px 12px;
  border: 1px solid #f0b8dc;
  border-radius: 8px;
  font-size: 13px;
  color: #3d0629;
  background: white;
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
  min-height: 38px;
}

.custom-select:hover {
  border-color: #eba1d0;
  background: linear-gradient(135deg, #fef9fc 0%, #ffffff 100%);
}

.custom-select:focus {
  outline: none;
  border-color: #cc1389;
  box-shadow: 0 0 0 3px rgba(204, 19, 137, 0.08);
}

.selected-value {
  flex: 1;
  font-weight: 500;
}

.dropdown-arrow {
  color: #cc1389;
  transition: transform 0.2s ease;
  flex-shrink: 0;
  margin-left: 8px;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.role-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #f0b8dc;
  border-radius: 10px;
  box-shadow: 0 8px 20px rgba(204, 19, 137, 0.12);
  z-index: 1000;
  animation: dropdownSlide 0.2s ease-out;
  overflow: hidden;
}

.role-option {
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #3d0629;
  position: relative;
}

.role-option:not(:last-child) {
  border-bottom: 1px solid rgba(250, 231, 243, 0.5);
}

.role-option:hover {
  background: linear-gradient(135deg, #fae7f3 0%, #f5d0e7 100%);
  padding-left: 16px;
}

.role-option.selected {
  background: linear-gradient(135deg, #fae7f3 0%, #f5d0e7 100%);
  color: #8f0d60;
  font-weight: 600;
}

.check-icon {
  color: #cc1389;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
}

.role-select:focus {
  background-color: #fef9fc;
}

.role-select option {
  padding: 10px;
  background: white;
  color: #3d0629;
}

.role-select option:hover {
  background: linear-gradient(135deg, #fae7f3 0%, #f5d0e7 100%);
}

.autocomplete-wrapper {
  position: relative;
}

.user-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #f0b8dc;
  border-radius: 12px;
  margin-top: 0.5rem;
  box-shadow: 0 10px 25px rgba(204, 19, 137, 0.15);
  max-height: 240px;
  overflow-y: auto;
  z-index: 1000;
  animation: dropdownSlide 0.2s ease-out;
}

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-dropdown-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #fae7f3;
}

.user-dropdown-item:last-child {
  border-bottom: none;
}

.user-dropdown-item:hover,
.user-dropdown-item.highlighted {
  background: linear-gradient(135deg, #fae7f3 0%, #f5d0e7 100%);
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #8f0d60;
  font-size: 0.875rem;
  margin-bottom: 0.125rem;
}

.user-email {
  font-size: 0.75rem;
  color: #a30f6e;
}

.user-icon {
  color: #eba1d0;
  flex-shrink: 0;
}

.no-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #f0b8dc;
  border-radius: 12px;
  margin-top: 0.5rem;
  padding: 1.5rem;
  text-align: center;
  color: #a30f6e;
  font-size: 0.875rem;
  box-shadow: 0 10px 25px rgba(204, 19, 137, 0.15);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  animation: dropdownSlide 0.2s ease-out;
}

.no-results svg {
  color: #eba1d0;
}

.helper-text {
  font-size: 12px;
  color: #a30f6e;
  margin-top: 6px;
  display: flex;
  align-items: center;
  font-style: italic;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fae7f3;
  border: 1px solid #f0b8dc;
  border-radius: 8px;
  margin-top: 16px;
}

.error-message svg {
  flex-shrink: 0;
  color: #cc1389;
}

.error-message span {
  font-size: 13px;
  color: #8f0d60;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #fae7f3;
  background: linear-gradient(135deg, #fae7f3 0%, #ffffff 100%);
  border-radius: 0 0 16px 16px;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
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

.btn-create:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

