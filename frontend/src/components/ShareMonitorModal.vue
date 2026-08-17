<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal share-modal">
      <div class="modal-header">
        <div class="modal-title-section">
          <h2>Share Monitor</h2>
          <p class="modal-subtitle">{{ monitor?.name }}</p>
        </div>
        <button class="close-btn" @click="emit('close')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label for="shareEmail">Share with (Email)</label>
          <div class="autocomplete-wrapper">
            <input 
              id="shareEmail" 
              v-model="shareEmail" 
              type="email" 
              placeholder="Type to search users..."
              :class="['form-control', { 'error': touched && errors.email }]"
              @input="handleEmailInput"
              @blur="handleBlur"
              @focus="showDropdown = true"
              @keydown.down.prevent="navigateDown"
              @keydown.up.prevent="navigateUp"
              @keydown.enter.prevent="selectHighlighted"
              @keydown.esc="showDropdown = false"
            />
            <span v-if="touched && errors.email" class="field-error">{{ errors.email }}</span>
            
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
            <div v-if="showDropdown && shareEmail && filteredUsers.length === 0 && !isSearching" class="no-results">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span>No users found</span>
            </div>
          </div>
          <p class="form-hint">Enter the email address of the person you want to share this monitor with. When accepted, the monitor will be added to their dashboard.</p>
        </div>

        <div v-if="errorMessage" class="error-banner">
          {{ errorMessage }}
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-cancel" @click="emit('close')">Cancel</button>
        <button class="btn btn-primary" @click="handleShare" :disabled="!isFormValid || sharing">
          {{ sharing ? 'Sharing...' : 'Share Monitor' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useSharesStore, ShareRole } from '../stores/shares';
import { addToast } from '../composables/useToast';

interface Monitor {
  id: string;
  name: string;
  type: string;
  target: string;
}

interface Props {
  monitor: Monitor;
}

interface User {
  id: number;
  name: string;
  email: string;
}

type ValidationErrors = {
  email?: string;
};

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'shared'): void }>();

const sharesStore = useSharesStore();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const shareEmail = ref('');
const sharing = ref(false);
const errorMessage = ref('');
const errors = ref<ValidationErrors>({});
const touched = ref(false);

// Autocomplete state
const availableUsers = ref<User[]>([]);
const showDropdown = ref(false);
const highlightedIndex = ref(0);
const isSearching = ref(false);

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

function validateEmail() {
  if (!shareEmail.value || shareEmail.value.trim() === '') {
    errors.value.email = 'Email is required';
    return false;
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(shareEmail.value)) {
    errors.value.email = 'Please enter a valid email address';
    return false;
  }
  if (shareEmail.value.includes(' ')) {
    errors.value.email = 'Email cannot contain spaces';
    return false;
  }
  errors.value.email = undefined;
  return true;
}

const isFormValid = computed(() => {
  return shareEmail.value && !errors.value.email;
});

// Autocomplete filtering with smart ranking
const filteredUsers = computed(() => {
  if (!shareEmail.value || shareEmail.value.trim() === '') return [];
  const query = shareEmail.value.toLowerCase().trim();
  
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
  if (touched.value) validateEmail();
}

function handleBlur() {
  touched.value = true;
  // Delay to allow click on dropdown
  setTimeout(() => {
    showDropdown.value = false;
  }, 200);
  validateEmail();
}

function selectUser(user: User) {
  shareEmail.value = user.email;
  showDropdown.value = false;
  touched.value = true;
  validateEmail();
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

// Watch for real-time validation
watch(() => shareEmail.value, () => {
  if (touched.value) validateEmail();
});

onMounted(() => {
  fetchUsers();
});

async function handleShare() {
  touched.value = true;
  errorMessage.value = '';

  if (!validateEmail()) {
    return;
  }

  sharing.value = true;

  try {
    await sharesStore.shareMonitor(props.monitor.id, { email: shareEmail.value }, ShareRole.VIEWER);
    addToast(`Monitor shared with ${shareEmail.value}`, 'success');
    emit('shared');
    emit('close');
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to share monitor';
    addToast(errorMessage.value, 'error');
  } finally {
    sharing.value = false;
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.share-modal {
  background: white;
  border-radius: 24px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 25px 50px rgba(204, 19, 137, 0.25);
  border: 2px solid #fae7f3;
  animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  padding: 2rem 2rem 1.5rem;
  background: linear-gradient(135deg, #fae7f3 0%, #f5d0e7 100%);
  border-bottom: 2px solid #f0b8dc;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.modal-title-section h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #8f0d60;
  margin: 0;
}

.modal-subtitle {
  font-size: 0.875rem;
  color: #a30f6e;
  margin-top: 0.25rem;
  font-weight: 500;
}

.close-btn {
  background: white;
  border: 2px solid #f0b8dc;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #cc1389;
}

.close-btn:hover {
  background: #fef9fc;
  border-color: #cc1389;
  transform: rotate(90deg);
}

.modal-body {
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #fae7f3;
  border-radius: 12px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: #cc1389;
  box-shadow: 0 0 0 4px rgba(204, 19, 137, 0.1);
  background: #fef9fc;
}

.form-control.error {
  border-color: #a30f6e;
  background-color: #fae7f3;
}

.form-control.error:focus {
  border-color: #8f0d60;
  box-shadow: 0 0 0 4px rgba(163, 15, 110, 0.15);
}

.field-error {
  display: block;
  color: #8f0d60;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  font-weight: 500;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-hint {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
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

.error-banner {
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #fae7f3 0%, #f5d0e7 100%);
  border: 2px solid #eba1d0;
  border-radius: 12px;
  color: #8f0d60;
  font-size: 0.875rem;
  margin-top: 1rem;
  font-weight: 500;
  animation: shake 0.3s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.modal-footer {
  padding: 1.5rem 2rem;
  background: #fef9fc;
  border-top: 1px solid #fae7f3;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-cancel {
  background: white;
  color: #6b7280;
  border: 2px solid #f0b8dc;
}

.btn-cancel:hover {
  background: #fae7f3;
  border-color: #eba1d0;
  color: #8f0d60;
}

.btn-primary {
  background: linear-gradient(135deg, #cc1389 0%, #a30f6e 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(204, 19, 137, 0.3);
  position: relative;
  overflow: hidden;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #b8117b 0%, #8f0d60 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(204, 19, 137, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
</style>
