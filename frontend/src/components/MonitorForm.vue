<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title-section">
          <h2>{{ isEdit ? 'Edit Monitor' : 'Add New Monitor' }}</h2>
          <p class="modal-subtitle">Configure your service monitoring settings</p>
        </div>
        <button class="close-btn" @click="emit('close')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="onSubmit">
          <!-- Basic Info Section -->
          <div class="section">
            <h3 class="section-title">Basic Info</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label for="monitorName">Monitor Name</label>
                <input 
                  type="text" 
                  id="monitorName" 
                  v-model="form.name" 
                  placeholder="Enter monitor name"
                  required
                />
              </div>
              
              <div class="form-group">
                <label for="monitorType">Monitor Type</label>
                <select id="monitorType" v-model="form.type" required>
                  <option value="http">HTTP/HTTPS</option>
                  <option value="tcp">TCP</option>
                  <option value="ping">PING</option>
                  <option value="smb">SMB</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="target">Target</label>
                <input 
                  type="text" 
                  id="target" 
                  v-model="form.target" 
                  :placeholder="form.type === 'http' ? 'https://example.com' : form.type === 'smb' ? '\\\\server\\share' : 'example.com'"
                  required
                />
              </div>
              
              <div class="form-group" v-if="form.type === 'tcp'">
                <label for="portNumber">Port Number</label>
                <input 
                  type="number" 
                  id="portNumber" 
                  v-model.number="form.port" 
                  placeholder="443"
                  min="1"
                  max="65535"
                  required
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="tags">Tags</label>
                <input 
                  type="text" 
                  id="tags" 
                  v-model="form.tags" 
                  placeholder="e.g., production, critical"
                />
              </div>
              
              <div class="form-group">
                <label for="dependency">Dependency <span style="color: #9ca3af;">(optional)</span></label>
                <input 
                  type="text" 
                  id="dependency" 
                  v-model="form.dependency" 
                  placeholder="e.g. VPN"
                />
              </div>
            </div>
          </div>

          <!-- Check Settings Section -->
          <div class="section">
            <h3 class="section-title">Check Settings</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label for="checkInterval">Check Interval</label>
                <div class="input-with-unit">
                  <input 
                    type="number" 
                    id="checkInterval" 
                    v-model.number="form.interval_seconds"
                    min="20"
                    required
                  />
                  <span class="input-unit">sec</span>
                </div>
              </div>
              
              <div class="form-group">
                <label for="timeout">Timeout</label>
                <div class="input-with-unit">
                  <input 
                    type="number" 
                    id="timeout" 
                    v-model.number="form.timeout_ms"
                    min="1"
                    required
                  />
                  <span class="input-unit">ms</span>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="maxRetries">Max Retries</label>
                <input 
                  type="number" 
                  id="maxRetries" 
                  v-model.number="form.max_retries"
                  min="1"
                  max="10"
                  required
                />
                <p class="helper-text">Retries before marking as down</p>
              </div>
              
              <div class="form-group">
                <label for="retryInterval">Retry Interval</label>
                <div class="input-with-unit">
                  <input 
                    type="number" 
                    id="retryInterval" 
                    v-model.number="form.retry_interval"
                    min="1"
                    required
                  />
                  <span class="input-unit">sec</span>
                </div>
                <p class="helper-text">Wait time between retries</p>
              </div>
            </div>
          </div>

          <!-- Notification Settings Section -->
          <div class="section">
            <h3 class="section-title">Notification Settings</h3>
            
            <div class="checkbox-group" style="margin-bottom: 16px;">
              <div class="checkbox-wrapper">
                <input type="checkbox" id="enableMonitoring" v-model="form.active" />
                <label for="enableMonitoring" class="checkbox-label">Enable monitoring</label>
              </div>
            </div>

            <div class="notification-options">
              <div class="notification-option">
                <div class="checkbox-wrapper">
                  <input 
                    type="checkbox" 
                    id="sendAlert" 
                    v-model="form.notify_alert"
                    :disabled="!form.active"
                  />
                  <label 
                    for="sendAlert" 
                    :class="['checkbox-label', { 'opacity-50 cursor-not-allowed': !form.active }]"
                  >
                    Send notification alert
                  </label>
                </div>
                <p class="helper-text" style="margin-left: 24px;">Show in-app notifications</p>
              </div>

              <div class="notification-option">
                <div class="checkbox-wrapper">
                  <input
                    type="checkbox"
                    id="sendEmail"
                    v-model="form.notify_owner"
                    :disabled="!form.active"
                  />
                  <label
                    for="sendEmail"
                    :class="['checkbox-label', { 'opacity-50 cursor-not-allowed': !form.active }]"
                  >
                    Send to my email
                  </label>
                </div>
                <p class="helper-text" style="margin-left: 24px;">Send email notifications</p>
              </div>
            </div>

            <div class="form-row" style="margin-top: 16px;">
              <div class="form-group full-width">
                <label for="resendInterval">Resend notification after</label>
                <div class="input-with-unit">
                  <input 
                    type="number" 
                    id="resendInterval" 
                    v-model.number="form.notification_resend_after"
                    min="5"
                    :disabled="!form.active"
                    required
                  />
                  <span class="input-unit">minutes</span>
                </div>
                <p class="helper-text">How long to wait before resending alert notifications</p>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-cancel" @click="emit('close')" :disabled="submitting">Cancel</button>
        <button type="submit" class="btn btn-create" @click="onSubmit" :disabled="submitting">
          <svg v-if="submitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ submitting ? 'Creating...' : (isEdit ? 'Save Changes' : 'Create Monitor') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, computed } from 'vue';
import { addToast } from '../composables/useToast';

type Form = {
  id?: string;
  name: string;
  type: 'http' | 'tcp' | 'ping' | 'smb';
  target: string;
  port?: number | null;
  interval_seconds: number;
  timeout_ms: number;
  max_retries: number;
  retry_interval: number;
  notification_resend_after: number;
  active: boolean;
  tags?: string | null;
  dependency?: string | null;
  email_recipients?: string | null;
  notify_alert: boolean;
  notify_owner: boolean;
};

const props = defineProps<{ value?: Partial<Form>; submitting?: boolean }>();
const emit = defineEmits<{ (e: 'submit', payload: Partial<Form>): void; (e: 'close'): void }>();


const form = reactive<Form>({
  name: '',
  type: 'http',
  target: '',
  port: null,
  interval_seconds: 60,
  timeout_ms: 5000,
  max_retries: 3,
  retry_interval: 60,
  notification_resend_after: 180,
  active: true,
  tags: null,
  dependency: null,
  email_recipients: null,
  notify_alert: true,
  notify_owner: false,
});

const isEdit = computed(() => Boolean(props.value?.id));

watch(() => props.value, (v) => {
  if (v) {
    Object.assign(form, v);
  }
}, { immediate: true });


// Auto-disable notify_alert and notify_owner when monitoring is disabled
watch(() => form.active, (isActive) => {
  if (!isActive) {
    form.notify_alert = false;
    form.notify_owner = false;
  }
});

// Auto-prefix https:// when type is http and clear when switching away
watch(() => form.type, (newType, oldType) => {
  if (newType === 'http') {
    // Only auto-prefix if target is empty or was auto-prefixed before
    if (!form.target || form.target === '' || form.target === 'https://') {
      form.target = 'https://';
    }
  } else if (oldType === 'http' && form.target === 'https://') {
    // Clear the field when switching away from http, but only if it's just the prefix
    form.target = '';
  }
}, { immediate: true });

function onSubmit() {
  if (form.type === 'tcp' && !form.port) {
    addToast('Port is required for TCP', 'error');
    return;
  }
  
  emit('submit', { ...form });
}
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

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: #8f0d60;
  margin-bottom: 6px;
}

.form-group input,
.form-group select {
  padding: 10px 12px;
  border: 1px solid #f0b8dc;
  border-radius: 8px;
  font-size: 14px;
  color: #3d0629;
  background: white;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #cc1389;
  box-shadow: 0 0 0 3px rgba(204, 19, 137, 0.1);
}

.form-group input::placeholder,
.form-group select::placeholder {
  color: #e089c4;
}

.input-with-unit {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-unit input {
  flex: 1;
  padding-right: 48px;
}

.input-unit {
  position: absolute;
  right: 12px;
  color: #a30f6e;
  font-size: 13px;
  pointer-events: none;
}

.checkbox-group {
  margin-bottom: 12px;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox-wrapper input[type="checkbox"] {
  width: 16px;
  height: 16px;
  border: 1px solid #f0b8dc;
  border-radius: 4px;
  cursor: pointer;
  accent-color: #cc1389;
}

.checkbox-label {
  font-size: 14px;
  color: #8f0d60;
  cursor: pointer;
  user-select: none;
}

.notification-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 8px;
  padding: 12px;
  background: rgba(250, 231, 243, 0.3);
  border-radius: 8px;
  border: 1px solid #fae7f3;
}

.notification-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.helper-text {
  font-size: 12px;
  color: #a30f6e;
  margin-top: 4px;
  font-style: italic;
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

.btn-create:hover {
  background: linear-gradient(135deg, #b8117b 0%, #8f0d60 100%);
  box-shadow: 0 6px 10px rgba(204, 19, 137, 0.3);
  transform: translateY(-1px);
}

</style>
