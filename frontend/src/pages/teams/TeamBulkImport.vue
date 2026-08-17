<template>
  <div class="p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-2">
        <button @click="goBack" class="text-gray-600 hover:text-brand transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-3xl font-bold text-brand">Bulk Import Monitors</h1>
      </div>
      <p class="text-gray-600 ml-9">Import multiple monitors from CSV file</p>
    </div>

    <!-- Step 1: Upload -->
    <div v-if="currentStep === 'upload'" class="bg-white rounded-lg shadow-md p-6">
      <div 
        class="upload-area"
        :class="{ 'drag-over': isDragging, 'has-file': selectedFile }"
        @drop.prevent="handleDrop"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @click="triggerFileInput"
      >
        <svg v-if="!selectedFile" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <svg v-else width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
          <polyline points="13 2 13 9 20 9"></polyline>
        </svg>
        <p v-if="!selectedFile" class="upload-text">Drop CSV file here or click to browse</p>
        <p v-else class="upload-text selected-file">{{ fileName }}</p>
        <p class="upload-hint">{{ selectedFile ? 'Click to change file' : 'Accepts .csv files (max 5 MB)' }}</p>
        <a href="#" @click.stop="downloadTemplate" class="download-template">Download sample CSV template »</a>
      </div>
      
      <input 
        ref="fileInput" 
        type="file" 
        accept=".csv" 
        style="display: none" 
        @change="handleFileSelect"
      />

      <div class="import-requirements">
        <p><strong>•</strong> Required columns: name, type, target, Optional: interval_seconds, timeout_ms, port, tags, dependency</p>
      </div>

      <div class="form-footer">
        <button class="btn btn-cancel" @click="goBack">Cancel</button>
        <button class="btn btn-next" @click="parseAndPreview" :disabled="!selectedFile">Next</button>
      </div>
    </div>

    <!-- Step 2: Preview -->
    <div v-if="currentStep === 'preview'" class="bg-white rounded-lg shadow-md p-6">
      <div class="validation-badges">
        <div class="badge badge-success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          {{ validMonitors.length }} valid monitors
        </div>
        <div v-if="warningMonitors.length > 0" class="badge badge-warning">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          {{ warningMonitors.length }} monitors with warnings
        </div>
        <div v-if="invalidMonitors.length > 0" class="badge badge-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {{ invalidMonitors.length }} invalid monitors
        </div>
      </div>

      <div class="preview-table">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Name</th>
              <th>Type</th>
              <th>Target</th>
              <th>Interval</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(monitor, index) in parsedMonitors" 
              :key="index"
              :class="{
                'row-valid': monitor.validation === 'valid',
                'row-warning': monitor.validation === 'warning',
                'row-error': monitor.validation === 'error'
              }"
            >
              <td>
                <svg v-if="monitor.validation === 'valid'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="8 12 11 15 16 10"></polyline>
                </svg>
                <svg v-else-if="monitor.validation === 'warning'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </td>
              <td>
                <div>{{ monitor.name }}</div>
                <div v-if="monitor.errors.length > 0" class="error-text">{{ monitor.errors.join(', ') }}</div>
              </td>
              <td>{{ monitor.type.toUpperCase() }}</td>
              <td>{{ monitor.target }}</td>
              <td>{{ monitor.interval_seconds }}s</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="invalidMonitors.length > 0" class="skip-invalid">
        <input type="checkbox" id="skipInvalid" v-model="skipInvalid" />
        <label for="skipInvalid">Skip invalid rows and import valid monitors only</label>
      </div>

      <div class="form-footer">
        <button class="btn btn-cancel" @click="currentStep = 'upload'">Back</button>
        <button 
          class="btn btn-import" 
          @click="importMonitors"
          :disabled="importing || (validMonitors.length === 0 && warningMonitors.length === 0)"
        >
          {{ importing ? 'Importing...' : `Import ${skipInvalid ? validMonitors.length + warningMonitors.length : parsedMonitors.length}` }}
        </button>
      </div>
    </div>

    <!-- Step 3: Complete -->
    <div v-if="currentStep === 'complete'" class="bg-white rounded-lg shadow-md p-6">
      <div class="complete-body">
        <div class="success-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <h3 class="complete-title">Imported "{{ fileName }}"</h3>
        <p style="font-size: 16px; color: #16a34a; margin-bottom: 20px; font-weight: 500;">{{ importResults?.created || 0 }} monitors imported successfully!</p>

        <div class="complete-summary">
          <div class="summary-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>{{ importResults?.created || 0 }} monitors imported successfully</span>
          </div>
          <div v-if="importResults?.errors && importResults.errors.length > 0" class="summary-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{{ importResults.errors.length }} monitors skipped due to errors</span>
          </div>
        </div>
      </div>

      <div class="form-footer">
        <button class="btn btn-cancel" @click="resetAndClose">Close</button>
        <button class="btn btn-view-dashboard" @click="resetAndClose">View Monitors</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { addToast } from '@/composables/useToast';

const route = useRoute();
const router = useRouter();

const teamId = parseInt(route.params.teamId as string);

const currentStep = ref<'upload' | 'preview' | 'complete'>('upload');
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const parsedMonitors = ref<any[]>([]);
const importResults = ref<{ created: number; errors: string[] } | null>(null);
const importing = ref(false);
const skipInvalid = ref(true);

const validMonitors = computed(() => parsedMonitors.value.filter(m => m.validation === 'valid'));
const warningMonitors = computed(() => parsedMonitors.value.filter(m => m.validation === 'warning'));
const invalidMonitors = computed(() => parsedMonitors.value.filter(m => m.validation === 'error'));

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];
  }
}

const fileName = computed(() => selectedFile.value?.name || '');

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  const files = event.dataTransfer?.files;
  if (files && files[0] && files[0].name.endsWith('.csv')) {
    selectedFile.value = files[0];
  } else {
    addToast('<strong>Invalid file</strong><br/>Please upload a valid CSV file', 'error');
  }
}

function downloadTemplate() {
  const template = `name,type,target,port,interval_seconds,timeout_ms,tags,dependency
Production API,http,https://api.example.com,,60,5000,production,
Database Server,tcp,db.example.com,5432,30,3000,database,
SMB Share,smb,\\\\server\\share,,120,10000,storage,VPN
Ping Monitor,ping,192.168.1.1,,60,5000,network,`;
  
  const blob = new Blob([template], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'monitor-import-template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

async function parseAndPreview() {
  if (!selectedFile.value) return;

  const text = await selectedFile.value.text();
  const lines = text.trim().split('\n');
  
  if (lines.length < 2) {
    addToast('<strong>Invalid CSV</strong><br/>CSV file is empty or invalid', 'error');
    return;
  }

  const headers = (lines[0] || '').split(',').map(h => h.trim().toLowerCase());
  const monitors = [];

  for (let i = 1; i < lines.length; i++) {
    const line = (lines[i] || '').trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const monitor: any = { errors: [], validation: 'valid' };

    headers.forEach((header, index) => {
      const value = values[index];
      if (header === 'port' || header === 'interval_seconds' || header === 'timeout_ms') {
        monitor[header] = value ? parseInt(value) : undefined;
      } else if (header === 'active') {
        monitor[header] = value ? value.toLowerCase() === 'true' : true;
      } else {
        monitor[header] = value || undefined;
      }
    });

    // Validation
    if (!monitor.name) {
      monitor.errors.push('Name is required');
      monitor.validation = 'error';
    }
    if (!monitor.type || !['http', 'tcp', 'ping', 'smb'].includes(monitor.type)) {
      monitor.errors.push('Invalid type');
      monitor.validation = 'error';
    }
    if (!monitor.target) {
      monitor.errors.push('Target is required');
      monitor.validation = 'error';
    }
    if (monitor.type === 'tcp' && !monitor.port) {
      monitor.errors.push('Port required for TCP');
      monitor.validation = 'warning';
    }
    if (monitor.interval_seconds && monitor.interval_seconds < 20) {
      monitor.errors.push('Interval too low (min 20s)');
      monitor.validation = 'warning';
    }

    // Set defaults
    monitor.interval_seconds = monitor.interval_seconds || 60;
    monitor.timeout_ms = monitor.timeout_ms || 5000;
    monitor.active = monitor.active !== undefined ? monitor.active : true;
    monitor.notify_owner = true;

    monitors.push(monitor);
  }

  parsedMonitors.value = monitors;
  currentStep.value = 'preview';
}

async function importMonitors() {
  importing.value = true;
  
  const monitorsToImport = skipInvalid.value 
    ? parsedMonitors.value.filter(m => m.validation !== 'error')
    : parsedMonitors.value;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/teams/${teamId}/monitors/bulk-import`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        ...(token ? { Authorization: `Bearer ${token}` } : {}) 
      },
      body: JSON.stringify(monitorsToImport.map(m => {
        const { errors, validation, ...monitorData } = m;
        return monitorData;
      })),
    });

    if (!response.ok) throw new Error('Import failed');

    const results = await response.json();
    importResults.value = results;

    // Show success notification
    const fileNameDisplay = selectedFile.value?.name || 'file';
    addToast(`<strong>Success</strong><br/>Successfully imported "${fileNameDisplay}"`, 'success');

    currentStep.value = 'complete';
  } catch (error: any) {
    addToast(`<strong>Import failed</strong><br/>${error.message}`, 'error');
    importResults.value = { created: 0, errors: [error.message] };
  } finally {
    importing.value = false;
  }
}

function resetAndClose() {
  router.push(`/teams/${teamId}/monitors`);
}

function goBack() {
  if (currentStep.value === 'preview') {
    currentStep.value = 'upload';
  } else {
    router.push(`/teams/${teamId}/monitors`);
  }
}
</script>

<style scoped>
.text-brand {
  color: #cb128a;
}

.upload-area {
  border: 2px dashed #f0b8dc;
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fae7f3;
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: #cc1389;
  background: #f5d0e7;
}

.upload-area.has-file {
  border-color: #16a34a;
  background: #dcfce7;
}

.upload-area svg {
  color: #cc1389;
  margin: 0 auto 16px;
}

.upload-text {
  font-size: 16px;
  font-weight: 600;
  color: #8f0d60;
  margin-bottom: 8px;
}

.upload-text.selected-file {
  color: #16a34a;
  font-size: 18px;
}

.upload-hint {
  font-size: 14px;
  color: #a30f6e;
  margin-bottom: 16px;
}

.download-template {
  color: #cc1389;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s;
}

.download-template:hover {
  color: #b8117b;
  text-decoration: underline;
}

.import-requirements {
  margin-top: 24px;
  padding: 16px 20px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 14px;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.validation-badges {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.badge-success {
  background: #dcfce7;
  color: #16a34a;
}

.badge-warning {
  background: #fef3c7;
  color: #f59e0b;
}

.badge-error {
  background: #fee2e2;
  color: #dc2626;
}

.preview-table {
  max-height: 450px;
  overflow-y: auto;
  border: 1px solid #fae7f3;
  border-radius: 8px;
  margin-bottom: 20px;
}

.preview-table table {
  width: 100%;
  border-collapse: collapse;
}

.preview-table th {
  background: #fae7f3;
  color: #8f0d60;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  padding: 14px;
  position: sticky;
  top: 0;
  z-index: 1;
}

.preview-table td {
  padding: 14px;
  font-size: 14px;
  border-bottom: 1px solid #f5d0e7;
}

.row-valid {
  background: #f0fdf4;
}

.row-warning {
  background: #fffbeb;
}

.row-error {
  background: #fef2f2;
}

.error-text {
  font-size: 12px;
  color: #dc2626;
  margin-top: 4px;
  font-style: italic;
}

.skip-invalid {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #6b7280;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.skip-invalid input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #cc1389;
  cursor: pointer;
}

.skip-invalid label {
  cursor: pointer;
}

.complete-body {
  text-align: center;
  padding: 40px 24px;
}

.success-icon {
  width: 90px;
  height: 90px;
  margin: 0 auto 24px;
  background: #dcfce7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.complete-title {
  font-size: 24px;
  font-weight: 700;
  color: #16a34a;
  margin-bottom: 12px;
}

.complete-summary {
  max-width: 450px;
  margin: 0 auto;
  text-align: left;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  margin-bottom: 10px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
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

.btn-next,
.btn-import,
.btn-view-dashboard {
  background: linear-gradient(135deg, #cc1389 0%, #a30f6e 100%);
  color: white;
  box-shadow: 0 4px 6px rgba(204, 19, 137, 0.2);
}

.btn-next:hover:not(:disabled),
.btn-import:hover:not(:disabled),
.btn-view-dashboard:hover:not(:disabled) {
  background: linear-gradient(135deg, #b8117b 0%, #8f0d60 100%);
  box-shadow: 0 6px 10px rgba(204, 19, 137, 0.3);
  transform: translateY(-1px);
}
</style>
