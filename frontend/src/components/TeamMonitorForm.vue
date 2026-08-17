<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <!-- Header -->
      <div class="modal-header">
        <div class="modal-title-section">
          <h2>{{ isEdit ? 'Edit Team Monitor' : 'Add Team Monitor' }}</h2>
          <p class="modal-subtitle">Configure monitoring for your team</p>
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
            
            <div class="checkbox-group">
              <div class="checkbox-wrapper">
                <input type="checkbox" id="enableMonitoring" v-model="form.active" />
                <label for="enableMonitoring" class="checkbox-label">Enable monitoring</label>
              </div>
            </div>

            <div class="checkbox-group">
              <div class="checkbox-wrapper">
                <input type="checkbox" id="sendEmail" v-model="form.notify_owner" />
                <label for="sendEmail" class="checkbox-label">Send notifications to my email</label>
              </div>
            </div>

            <div style="margin-top: 16px;">
              <div class="resend-config">
                <label for="resendAfter">Resend Notification After</label>
                <div class="input-with-unit">
                  <input 
                    type="number" 
                    id="resendAfter" 
                    v-model.number="form.notification_resend_after"
                    min="1"
                    max="1440"
                    required
                  />
                  <span class="input-unit">m</span>
                </div>
              </div>
              <p class="resend-help">Send reminder if monitor stays down</p>
            </div>
          </div>

          <!-- Team Info Notice -->
          <div class="team-notice">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cc1389" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <div>
              <p class="notice-title">Team Monitor</p>
              <p class="notice-text">This monitor will be visible to all team members</p>
            </div>
          </div>
        </form>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-cancel" @click="emit('close')">Cancel</button>
        <button type="submit" class="btn btn-create" @click="onSubmit">
          {{ isEdit ? 'Save Changes' : 'Create Team Monitor' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, computed } from 'vue';

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
  notify_owner: boolean;
};

const props = defineProps<{ 
  value?: Partial<Form>; 
  teamId: number;
}>();

const emit = defineEmits<{ 
  (e: 'submit', payload: Partial<Form>): void; 
  (e: 'close'): void;
}>();

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
  notify_owner: true,
});

const isEdit = computed(() => Boolean(props.value?.id));

// Parse existing values when editing
watch(() => props.value, (v) => {
  if (v) {
    Object.assign(form, v);
  }
}, { immediate: true });

function onSubmit() {
  if (form.type === 'tcp' && !form.port) {
    alert('Port is required for TCP');
    return;
  }
  
  emit('submit', { ...form });
}
</script>

<style scoped>
/* Color Theme Variables */
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

.helper-text {
  font-size: 12px;
  color: #a30f6e;
  margin-top: 4px;
  font-style: italic;
}

.resend-config {
  display: flex;
  align-items: center;
  gap: 12px;
}

.resend-config label {
  font-size: 13px;
  font-weight: 500;
  color: #8f0d60;
  margin: 0;
  flex-shrink: 0;
}

.resend-config input {
  width: 80px;
  padding: 8px 12px;
  border: 1px solid #f0b8dc;
  border-radius: 8px;
  font-size: 14px;
  color: #3d0629;
  background: white;
  transition: all 0.2s;
}

.resend-config input:focus {
  outline: none;
  border-color: #cc1389;
  box-shadow: 0 0 0 3px rgba(204, 19, 137, 0.1);
}

.resend-help {
  font-size: 12px;
  color: #a30f6e;
  margin-top: 6px;
  font-style: italic;
}

.team-notice {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(250, 231, 243, 0.5) 0%, rgba(245, 208, 231, 0.3) 100%);
  border: 1px solid #f5d0e7;
  border-radius: 8px;
  margin-top: 24px;
}

.team-notice svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.notice-title {
  font-size: 14px;
  font-weight: 600;
  color: #8f0d60;
  margin: 0 0 4px 0;
}

.notice-text {
  font-size: 13px;
  color: #a30f6e;
  margin: 0;
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
