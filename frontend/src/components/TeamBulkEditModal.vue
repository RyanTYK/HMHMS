<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <!-- Header -->
      <div class="modal-header">
        <div class="modal-title-section">
          <h2>Bulk Edit Team Monitors</h2>
          <p class="modal-subtitle">Edit {{ monitorCount }} monitor{{ monitorCount > 1 ? 's' : '' }}</p>
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
          <!-- Check Settings Section -->
          <div class="section">
            <div class="section-header">
              <h3 class="section-title">Check Settings</h3>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="checkInterval">Check Interval</label>
                <div class="input-with-unit">
                  <input 
                    type="number" 
                    id="checkInterval" 
                    v-model.number="formData.interval_seconds"
                    min="20"
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
                    v-model.number="formData.timeout_ms"
                    min="1"
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
                  v-model.number="formData.max_retries"
                  min="1"
                  max="10"
                />
                <p class="helper-text">Retries before marking as down</p>
              </div>
              
              <div class="form-group">
                <label for="retryInterval">Retry Interval</label>
                <div class="input-with-unit">
                  <input 
                    type="number" 
                    id="retryInterval" 
                    v-model.number="formData.retry_interval"
                    min="1"
                  />
                  <span class="input-unit">sec</span>
                </div>
                <p class="helper-text">Wait time between retries</p>
              </div>
            </div>
          </div>

          <!-- Notification Settings Section -->
          <div class="section">
            <div class="section-header">
              <h3 class="section-title">Notification Settings</h3>
            </div>
            
            <div class="checkbox-group" style="margin-bottom: 16px;">
              <div class="checkbox-wrapper">
                <input type="checkbox" id="enableMonitoring" v-model="formData.active" />
                <label for="enableMonitoring" class="checkbox-label">Enable monitoring</label>
              </div>
            </div>

            <div class="notification-options">
              <div class="notification-option">
                <div class="checkbox-wrapper">
                  <input 
                    type="checkbox" 
                    id="notifyAlert" 
                    v-model="formData.notify_alert" 
                  />
                  <label for="notifyAlert" class="checkbox-label">Send alert notifications</label>
                </div>
                <p class="helper-text" style="margin-left: 24px;">Show in-app notifications</p>
              </div>

              <div class="notification-option">
                <div class="checkbox-wrapper">
                  <input 
                    type="checkbox" 
                    id="notifyOwner" 
                    v-model="formData.notify_owner" 
                  />
                  <label for="notifyOwner" class="checkbox-label">Notify team owner</label>
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
                    v-model.number="formData.notification_resend_after"
                    min="5"
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
        <button type="button" class="btn btn-cancel" @click="$emit('close')" :disabled="submitting">Cancel</button>
        <button type="submit" class="btn btn-create" @click="handleSubmit" :disabled="submitting">
          <svg v-if="submitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ submitting ? 'Updating...' : 'Update Monitors' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { addToast } from '../composables/useToast';
import { useMonitorsStore } from '../stores/monitors';
import axios from 'axios';

const props = defineProps<{
  monitorIds: string[]
  teamId: number
}>();

const emit = defineEmits<{
  close: []
  success: []
}>();

const store = useMonitorsStore();
const submitting = ref(false);

const formData = ref({
  interval_seconds: 60,
  timeout_ms: 5000,
  max_retries: 3,
  retry_interval: 60,
  notification_resend_after: 180,
  notify_alert: true,
  notify_owner: true,
  active: true
});

const monitorCount = computed(() => props.monitorIds.length);

async function handleSubmit() {
  submitting.value = true;

  try {
    const updates: any = {
      interval_seconds: formData.value.interval_seconds,
      timeout_ms: formData.value.timeout_ms,
      max_retries: formData.value.max_retries,
      retry_interval: formData.value.retry_interval,
      notification_resend_after: formData.value.notification_resend_after,
      notify_alert: formData.value.notify_alert,
      notify_owner: formData.value.notify_owner,
      active: formData.value.active
    };

    let successCount = 0;
    let errorCount = 0;

    for (const monitorId of props.monitorIds) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(
          `/api/teams/${props.teamId}/monitors/${monitorId}`,
          updates,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        successCount++;
      } catch (error) {
        console.error(`Failed to update team monitor ${monitorId}:`, error);
        errorCount++;
      }
    }

    // Refresh the team monitors list
    await store.fetchTeamMonitors(props.teamId);

    if (successCount > 0) {
      addToast(
        `Successfully updated ${successCount} monitor${successCount > 1 ? 's' : ''}`,
        'success'
      );
    }

    if (errorCount > 0) {
      addToast(
        `Failed to update ${errorCount} monitor${errorCount > 1 ? 's' : ''}`,
        'error'
      );
    }

    if (errorCount === 0) {
      emit('success');
      emit('close');
    }
  } catch (error: any) {
    addToast(error?.response?.data?.message || 'Failed to update team monitors', 'error');
  } finally {
    submitting.value = false;
  }
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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #fae7f3;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #8f0d60;
  margin: 0;
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

.input-with-unit {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-unit input {
  flex: 1;
  padding-right: 50px;
}

.input-unit {
  position: absolute;
  right: 12px;
  font-size: 13px;
  color: #a30f6e;
  font-weight: 500;
  pointer-events: none;
}

.helper-text {
  font-size: 11px;
  color: #a30f6e;
  margin: 4px 0 0;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox-wrapper input[type="checkbox"] {
  width: 18px;
  height: 18px;
  border: 2px solid #f0b8dc;
  border-radius: 4px;
  cursor: pointer;
  accent-color: #cc1389;
}

.checkbox-label {
  font-size: 14px;
  color: #3d0629;
  cursor: pointer;
  user-select: none;
}

.notification-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: rgba(250, 231, 243, 0.3);
  border-radius: 8px;
  border: 1px solid #fae7f3;
}

.notification-option {
  display: flex;
  align-items: center;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.btn-cancel:hover:not(:disabled) {
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

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
