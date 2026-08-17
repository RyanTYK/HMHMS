<template>
  <div class="p-6 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-2">
        <button @click="goBack" class="text-gray-600 hover:text-brand transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-3xl font-bold text-brand">Add New Monitor</h1>
      </div>
      <p class="text-gray-600 ml-9">Configure your service monitoring settings</p>
    </div>

    <div class="bg-white rounded-lg shadow-md p-6">
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
              <label for="sendEmail" class="checkbox-label">Send to my email</label>
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

        <!-- Footer Buttons -->
        <div class="form-footer">
          <button type="button" class="btn btn-cancel" @click="goBack">Cancel</button>
          <button type="submit" class="btn btn-create">Create Monitor</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { addToast } from '@/composables/useToast';

type Form = {
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

const route = useRoute();
const router = useRouter();

const teamId = parseInt(route.params.teamId as string);

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

async function onSubmit() {
  if (form.type === 'tcp' && !form.port) {
    addToast('<strong>Validation Error</strong><br/>Port is required for TCP', 'error');
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/teams/${teamId}/monitors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(form)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create monitor' }));
      throw new Error(error.error || 'Failed to create monitor');
    }

    addToast('<strong>Success</strong><br/>Monitor created successfully', 'success');
    router.push(`/teams/${teamId}/monitors`);
  } catch (error: any) {
    console.error('Error creating monitor:', error);
    addToast(`<strong>Error</strong><br/>${error.message}`, 'error');
  }
}

function goBack() {
  router.push(`/teams/${teamId}/monitors`);
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

.section {
  margin-bottom: 32px;
}

.section:last-of-type {
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #8f0d60;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #fae7f3;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #8f0d60;
  margin-bottom: 8px;
}

.form-group input,
.form-group select {
  padding: 12px 14px;
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
  padding-right: 52px;
}

.input-unit {
  position: absolute;
  right: 14px;
  color: #a30f6e;
  font-size: 14px;
  font-weight: 500;
  pointer-events: none;
}

.checkbox-group {
  margin-bottom: 16px;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.checkbox-wrapper input[type="checkbox"] {
  width: 18px;
  height: 18px;
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
  font-size: 13px;
  color: #a30f6e;
  margin-top: 6px;
  font-style: italic;
}

.resend-config {
  display: flex;
  align-items: center;
  gap: 12px;
}

.resend-config label {
  font-size: 14px;
  font-weight: 500;
  color: #8f0d60;
  margin: 0;
  flex-shrink: 0;
}

.resend-config input {
  width: 100px;
  padding: 10px 14px;
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
  font-size: 13px;
  color: #a30f6e;
  margin-top: 8px;
  font-style: italic;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px solid #fae7f3;
}

.btn {
  padding: 12px 24px;
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

.text-brand {
  color: #cb128a;
}
</style>
