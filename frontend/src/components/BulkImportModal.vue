<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal import-modal">
      <!-- Step 1: Upload -->
      <div v-if="currentStep === 'upload'" class="import-step">
        <div class="modal-header">
          <div class="modal-title-section">
            <h2>Bulk Import Monitors</h2>
          </div>
          <button class="close-btn" @click="emit('close')">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body">
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
        </div>

        <div class="modal-footer">
          <button class="btn btn-cancel" @click="emit('close')">Cancel</button>
          <button class="btn btn-next" @click="parseAndPreview" :disabled="!selectedFile">Next</button>
        </div>
      </div>

      <!-- Step 2: Preview -->
      <div v-if="currentStep === 'preview'" class="import-step">
        <div class="modal-header">
          <div class="modal-title-section">
            <h2>Preview Import</h2>
            <p class="modal-subtitle">Review • Import</p>
          </div>
          <button class="close-btn" @click="emit('close')">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body">
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
            <div class="selected-count">
              {{ selectedCount }} of {{ selectableMonitors.length }} selected
            </div>
          </div>

          <div class="preview-table">
            <table>
              <thead>
                <tr>
                  <th class="checkbox-col">
                    <input 
                      type="checkbox"
                      class="header-checkbox"
                      :checked="allSelectableSelected"
                      :disabled="selectableMonitors.length === 0"
                      @change="toggleSelectAll"
                    />
                  </th>
                  <th class="status-col">Status</th>
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
                  @click="monitor.validation !== 'error' && toggleMonitorSelection(index)"
                  :style="{ cursor: monitor.validation !== 'error' ? 'pointer' : 'not-allowed' }"
                >
                  <td class="checkbox-cell">
                    <input 
                      type="checkbox"
                      class="monitor-checkbox"
                      :checked="selectedMonitors.has(index)"
                      :disabled="monitor.validation === 'error'"
                      @click.stop="toggleMonitorSelection(index)"
                    />
                  </td>
                  <td class="status-cell">
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
                    <div>{{ monitor.name || '(no name)' }}</div>
                    <div v-if="monitor.errors.length > 0" class="error-text">{{ monitor.errors.join(', ') }}</div>
                  </td>
                  <td>{{ monitor.type ? monitor.type.toUpperCase() : '(invalid)' }}</td>
                  <td>{{ monitor.target || '(no target)' }}</td>
                  <td>{{ monitor.interval_seconds ? monitor.interval_seconds + 's' : '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        <div class="modal-footer">
          <button class="btn btn-cancel" @click="currentStep = 'upload'">Back</button>
          <button 
            class="btn btn-import" 
            @click="importMonitors"
            :disabled="importing || selectedCount === 0"
          >
            <span v-if="importing">Importing...</span>
            <span v-else>
              Import {{ selectedCount }} monitor{{ selectedCount !== 1 ? 's' : '' }}
            </span>
          </button>
        </div>
      </div>

      <!-- Step 3: Complete -->
      <div v-if="currentStep === 'complete'" class="import-step">
        <div class="modal-header">
          <div class="modal-title-section">
            <h2>Import Complete</h2>
          </div>
          <button class="close-btn" @click="emit('close')">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body complete-body">
          <div class="success-icon animate-success">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>

          <h3 class="complete-title animate-fade-in">Imported "{{ fileName }}"</h3>
          <p class="animate-fade-in" style="font-size: 16px; color: #16a34a; margin-bottom: 20px; font-weight: 500; animation-delay: 0.1s;">{{ importResults?.created || 0 }} monitors imported successfully!</p>

          <div class="complete-summary">
            <div class="summary-item animate-slide-up" style="animation-delay: 0.2s;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>{{ importResults?.created || 0 }} monitors imported successfully</span>
            </div>
            <div v-if="importResults?.errors && importResults.errors.length > 0" class="summary-item animate-slide-up" style="animation-delay: 0.3s;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{{ importResults.errors.length }} monitors skipped due to errors</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-cancel" @click="resetAndClose">Close</button>
          <button class="btn btn-view-dashboard" @click="resetAndClose">View Dashboard</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMonitorsStore } from '../stores/monitors';
import { addToast, escapeHtml } from '../composables/useToast';

const emit = defineEmits<{ (e: 'close'): void }>();

const monitorsStore = useMonitorsStore();

const currentStep = ref<'upload' | 'preview' | 'complete'>('upload');
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const parsedMonitors = ref<any[]>([]);
const importResults = ref<{ created: number; errors: string[] } | null>(null);
const importing = ref(false);
const skipInvalid = ref(true);
const selectedMonitors = ref<Set<number>>(new Set());

const validMonitors = computed(() => parsedMonitors.value.filter(m => m.validation === 'valid'));
const warningMonitors = computed(() => parsedMonitors.value.filter(m => m.validation === 'warning'));
const invalidMonitors = computed(() => parsedMonitors.value.filter(m => m.validation === 'error'));
const selectableMonitors = computed(() => parsedMonitors.value.filter(m => m.validation !== 'error'));
// Original indexes (into parsedMonitors) of every row that can be imported.
// selectedMonitors stores ORIGINAL indexes, so filtered positions must never be used here.
const selectableIndexes = computed(() =>
  parsedMonitors.value
    .map((m, index) => ({ m, index }))
    .filter(({ m }) => m.validation !== 'error')
    .map(({ index }) => index)
);
const allSelectableSelected = computed(() => {
  return selectableIndexes.value.length > 0 &&
    selectableIndexes.value.every(index => selectedMonitors.value.has(index));
});
const selectedCount = computed(() => selectedMonitors.value.size);

function triggerFileInput() {
  fileInput.value?.click();
}

function toggleMonitorSelection(index: number) {
  if (selectedMonitors.value.has(index)) {
    selectedMonitors.value.delete(index);
  } else {
    selectedMonitors.value.add(index);
  }
}

function toggleSelectAll() {
  if (allSelectableSelected.value) {
    selectedMonitors.value.clear();
  } else {
    selectedMonitors.value.clear();
    selectableIndexes.value.forEach(index => selectedMonitors.value.add(index));
  }
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
    addToast('Please upload a valid CSV file', 'error');
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

// RFC-4180-ish line parser: handles quoted fields (so a comma inside
// "prod, critical" doesn't split the field), and "" as an escaped quote
// inside a quoted field. A naive split(',') would misalign every column
// after a quoted field containing a comma.
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  values.push(current.trim());
  return values;
}

async function parseAndPreview() {
  if (!selectedFile.value) return;

  const text = await selectedFile.value.text();
  const lines = text.trim().split('\n');
  
  if (lines.length < 2 || !lines[0]) {
    addToast('CSV file is empty or invalid', 'error');
    return;
  }

  const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
  const monitors = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;

    const values = parseCsvLine(line);
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
  
  // Auto-select all valid and warning monitors
  selectedMonitors.value.clear();
  monitors.forEach((monitor, index) => {
    if (monitor.validation !== 'error') {
      selectedMonitors.value.add(index);
    }
  });
  
  currentStep.value = 'preview';
}

async function importMonitors() {
  importing.value = true;
  
  const monitorsToImport = parsedMonitors.value.filter((_, index) => selectedMonitors.value.has(index));

  try {
    const token = localStorage.getItem('token');

    const response = await fetch('/api/monitors/bulk-import', {
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
    importResults.value = results.data || results;

    await monitorsStore.fetchAll();

    currentStep.value = 'complete';
  } catch (error: any) {
    addToast(`Import failed: ${escapeHtml(error.message)}`, 'error');
    importResults.value = { created: 0, errors: [error.message] };
  } finally {
    importing.value = false;
  }
}

function resetAndClose() {
  currentStep.value = 'upload';
  selectedFile.value = null;
  parsedMonitors.value = [];
  importResults.value = null;
  selectedMonitors.value.clear();
  emit('close');
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
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
  border: 1px solid #fae7f3;
}

.import-modal {
  max-width: 900px;
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
  margin-top: 16px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 13px;
  color: #6b7280;
}

.validation-badges {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid;
}

.badge-success {
  background: #f0fdf4;
  color: #15803d;
  border-color: #86efac;
}

.badge-warning {
  background: #fffbeb;
  color: #b45309;
  border-color: #fcd34d;
}

.badge-error {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fca5a5;
}

.selected-count {
  font-size: 13px;
  color: #7a0b52;
  font-weight: 600;
  margin-left: auto;
}

.preview-table {
  max-height: 450px;
  overflow-y: auto;
  border: 1px solid #eba1d0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(204, 19, 137, 0.08);
}

.preview-table table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.preview-table th {
  background: linear-gradient(to bottom, #fae7f3, #f5d0e7);
  color: #7a0b52;
  font-size: 12px;
  font-weight: 700;
  text-align: left;
  padding: 14px 16px;
  position: sticky;
  top: 0;
  z-index: 1;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #d642a1;
}

.checkbox-col {
  width: 50px;
  text-align: center;
}

.header-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #cc1389;
  border-radius: 4px;
}

.header-checkbox:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.status-col {
  width: 60px;
  text-align: center;
}

.preview-table td {
  padding: 14px 16px;
  font-size: 13px;
  border-bottom: 1px solid #f5d0e7;
  color: #374151;
}

.checkbox-cell {
  width: 50px;
  text-align: center;
  vertical-align: middle;
}

.monitor-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #cc1389;
  border-radius: 4px;
}

.monitor-checkbox:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.status-cell {
  width: 50px;
  text-align: center;
  vertical-align: middle;
}

.preview-table tbody tr {
  transition: all 0.2s;
}

.preview-table tbody tr:hover:not(.row-error) {
  background: #fae7f3 !important;
}

.row-valid {
  background: white;
}

.row-warning {
  background: #fffef5;
}

.row-error {
  background: #fff5f5;
  opacity: 0.7;
}

.error-text {
  font-size: 11px;
  color: #dc2626;
  margin-top: 6px;
  font-style: italic;
  line-height: 1.4;
  padding: 4px 8px;
  background: #fee2e2;
  border-radius: 4px;
  display: inline-block;
}

.complete-body {
  text-align: center;
  padding: 40px 24px;
}

.success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: #dcfce7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Success animations */
.animate-success {
  animation: successBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes successBounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
  opacity: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slideUp 0.5s ease-out forwards;
  opacity: 0;
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

.complete-title {
  font-size: 24px;
  font-weight: 700;
  color: #16a34a;
  margin-bottom: 24px;
}

.complete-summary {
  max-width: 400px;
  margin: 0 auto;
  text-align: left;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
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