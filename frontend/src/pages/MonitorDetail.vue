<template>
  <div class="p-6 max-w-7xl mx-auto">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-brand">Monitor Detail</h1>
      <div class="flex items-center gap-3">
        <button @click="refreshData" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-all font-medium border border-gray-200 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>

        <button
          :disabled="testSending"
          @click="sendTestEmail"
          class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-all font-medium border border-gray-200 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span v-if="!testSending">Send Test Notification</span>
          <span v-else>Sending…</span>
        </button>

        <button @click="triggerCheck" class="px-4 py-2 text-white bg-brand hover:bg-brand/90 rounded-xl transition-all font-medium flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Run Check Now
        </button>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-16">
      <div class="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4"></div>
      <p class="text-lg text-gray-600">Loading monitor details...</p>
    </div>
    
    <div v-else>
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div class="flex items-center gap-4 mb-3 md:mb-0">
            <h2 class="text-xl font-semibold">{{ monitor.name }}</h2>
            <!-- Enhanced Type Badge - Bigger -->
            <span class="inline-flex items-center px-4 py-2.5 rounded-full bg-slate-100 text-slate-700 text-sm font-bold uppercase tracking-wide border border-slate-200 shadow-md hover:shadow-lg hover:bg-slate-200 transition-all duration-200">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {{ monitor.type }}
            </span>
            <!-- Enhanced Status Badge - Bigger -->
            <span :class="enhancedStatusClass" class="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-bold uppercase tracking-wide border shadow-md transition-all duration-200 hover:shadow-lg transform hover:scale-105">
              <span :class="statusDotClass" class="w-3 h-3 rounded-full mr-2.5 animate-pulse"></span>
              {{ monitor.status.toUpperCase() }}
            </span>
          </div>
          <div class="flex flex-col md:text-right">
            <span class="text-sm text-gray-500">Target: <span class="font-medium">{{ monitor.target }}</span></span>
          </div>
        </div>
      </div>

      <!-- Check Information Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-md p-4 border-l-4" style="border-left-color: #d81b60;">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Last Check</p>
              <p class="text-lg font-semibold text-gray-900">{{ formatDate(monitor.lastChecked, true) }}</p>
            </div>
            <div class="p-2 rounded-lg" style="background-color: rgba(203, 18, 138, 0.1);">
              <svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-4 border-l-4" style="border-left-color: #d81b60;">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Last Response</p>
              <p class="text-lg font-semibold text-gray-900">{{ lastResponseTime }}ms</p>
            </div>
            <div class="p-2 rounded-lg" style="background-color: rgba(160, 16, 111, 0.1);">
              <svg class="w-5 h-5" style="color: #a0106f;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-4 border-l-4" style="border-left-color: #d81b60;">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Next Check</p>
              <p class="text-lg font-semibold text-gray-900">
                {{ timeUntilNextCheck }}
                <span v-if="timeUntilNextCheck === 'Due now'" class="inline-block w-2 h-2 bg-orange-400 rounded-full ml-2 animate-pulse"></span>
              </p>
              <p class="text-xs text-gray-500 mt-1">Every {{ formatInterval(monitor.interval_seconds) }}</p>
            </div>
            <div class="p-2 rounded-lg" style="background-color: rgba(216, 27, 96, 0.1);">
              <svg class="w-5 h-5" style="color: #d81b60;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 class="text-lg font-semibold mb-4 text-gray-700">Response Time History</h3>
        
        <!-- Show message when monitoring is disabled -->
        <div v-if="!monitor.active" class="flex flex-col items-center justify-center h-60 text-gray-500">
          <svg class="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-lg font-medium text-gray-700">Monitoring Disabled</p>
          <p class="text-sm mt-2">Enable monitoring to start collecting data</p>
        </div>
        
        <!-- Show chart when monitoring is enabled -->
        <div v-else>
          <div class="h-60">
            <canvas id="responseChart"></canvas>
          </div>
          <div v-if="chartData.length === 0" class="flex justify-center items-center h-40 text-gray-500">
            No response time data available yet
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <h3 class="text-lg font-semibold text-gray-700">Recent Check Logs</h3>
          <div class="flex flex-col sm:flex-row sm:items-center gap-4">
            <div class="flex items-center bg-gray-100 rounded-lg p-1">
              <button 
                @click="setRange('1h')" 
                :class="selectedRange === '1h' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'" 
                class="px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200"
              >
                1h
              </button>
              <button 
                @click="setRange('6h')" 
                :class="selectedRange === '6h' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'" 
                class="px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200"
              >
                6h
              </button>
              <button 
                @click="setRange('24h')" 
                :class="selectedRange === '24h' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'" 
                class="px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200"
              >
                1d
              </button>
              <button 
                @click="setRange('7d')" 
                :class="selectedRange === '7d' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'" 
                class="px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200"
              >
                7d
              </button>
            </div>
            <div class="flex items-center gap-2 text-sm text-gray-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{{ logs.length }} entries</span>
            </div>
          </div>
        </div>
        
        <div class="overflow-x-auto max-h-96 overflow-y-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50">
                <th class="text-left py-3 px-4 font-semibold text-gray-600">Timestamp</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-600">Response Time (ms)</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-600">HTTP Status</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-600">Error</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in logs" :key="log.id" class="border-b hover:bg-gray-50 transition-colors">
                <td class="py-3 px-4">{{ formatDate(log.timestamp) }}</td>
                <td class="py-3 px-4">
                  <span :class="log.status === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" 
                        class="px-2 py-1 rounded-full text-xs font-medium">
                    {{ log.status.toUpperCase() }}
                  </span>
                </td>
                <td class="py-3 px-4 font-mono">{{ log.response_time_ms || '—' }}</td>
                <td class="py-3 px-4 font-mono">{{ log.http_status || '—' }}</td>
                <td class="py-3 px-4 text-red-600">{{ log.error_text || '—' }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="!logs.length" class="text-gray-500 mt-4 text-center py-8">No logs available yet.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Chart from 'chart.js/auto';
import { addToast } from '../composables/useToast';

const route = useRoute();
const router = useRouter();
const monitor = ref({
  id: route.params.id,
  name: '',
  type: '',
  target: '',
  status: '',
  lastChecked: '',
  interval_seconds: 60,
  active: true,
});
const chartData = ref<number[]>([]);
const chartLabels = ref<string[]>([]);
const logs = ref<any[]>([]);
let chartInstance: Chart | null = null;
const loading = ref(true);
const testSending = ref(false);
const selectedRange = ref('1h');
const currentTime = ref(new Date());
const lastRefreshTime = ref(new Date());
let countdownTimer: number | null = null;

async function refreshData() {
  lastRefreshTime.value = new Date();
  currentTime.value = new Date();
  await fetchMonitorDetail();
}

async function triggerCheck() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/monitors/${route.params.id}/check-now`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('Failed to trigger check');
    
    // Update refresh time to prevent countdown timer conflicts
    lastRefreshTime.value = new Date();
    
    // Refresh immediately after triggering
    await fetchMonitorDetail();
    
    // Also refresh after a short delay to catch any potential timing issues
    setTimeout(async () => {
      await fetchMonitorDetail();
    }, 1000);
  } catch (error) {
    console.error('Error triggering check:', error);
  }
}

async function sendTestEmail() {
  if (!route.params.id) return;
  testSending.value = true;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/monitors/${route.params.id}/send-test-email`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      const msg = err.error || res.statusText || 'Failed to send test notification';
      addToast(`<strong>Test failed</strong><br/>${msg}`, 'error');
    } else {
      const data = await res.json().catch(() => ({ ok: true }));
      const sent = (data.sent !== undefined) ? data.sent : 'recipients';
      addToast(`<strong>Test sent</strong><br/>Sent to ${sent} recipient(s)`, 'success');
    }
  } catch (error) {
  console.error('Error sending test email:', error);
  const msg = (error as any)?.message || String(error);
  addToast(`<strong>Error</strong><br/>${msg}`, 'error');
  } finally {
    testSending.value = false;
  }
}


function setRange(range: string) {
  selectedRange.value = range;
  fetchMonitorDetail();
}

async function fetchMonitorDetail() {
  loading.value = true;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/monitors/${route.params.id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Monitor not found');
      }
      throw new Error('Failed to fetch monitor details');
    }
    const data = await res.json();
    console.log('Monitor data received:', data);
    console.log('Monitor interval_seconds:', data.interval_seconds);
    
    // Validate monitor data
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid monitor data received');
    }
    
    // Set monitor data directly from API response (now includes lastChecked and status)
    monitor.value = {
      ...data,
      // Ensure we use the lastChecked from the API response
      lastChecked: data.lastChecked || data.last_check || '',
      status: data.status || 'unknown',
      active: data.active !== undefined ? data.active : true,
      interval_seconds: data.interval_seconds || 60
    };
    
  const logsRes = await fetch(`/api/monitors/${route.params.id}/logs?range=${selectedRange.value}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!logsRes.ok) throw new Error('Failed to fetch logs');
    const logsData = await logsRes.json(); // Assume API returns logs in ascending order (oldest first)
    
    console.log('Fetched logsData:', logsData);
    
    // Validate logs data
    if (!Array.isArray(logsData)) {
      console.warn('Invalid logs data received, using empty array');
      logs.value = [];
      chartData.value = [];
      chartLabels.value = [];
    } else {
      logs.value = logsData.slice().reverse(); // Keep logs newest first for the table
      chartData.value = logsData.map((l: any) => l?.response_time_ms || 0);
      chartLabels.value = logsData.map((l: any) => formatDate(l?.timestamp, true));
    }
    console.log('Mapped chartData:', chartData.value);
    console.log('Mapped chartLabels:', chartLabels.value);

    // Only update status and lastChecked from logs if the API didn't provide them
    if (Array.isArray(logsData) && logsData.length > 0 && (!monitor.value.lastChecked || !monitor.value.status)) {
      const latestLog = logsData[logsData.length - 1];
      if (latestLog && (!monitor.value.status || monitor.value.status === 'unknown')) {
        monitor.value.status = latestLog.status || 'unknown';
      }
      if (latestLog && !monitor.value.lastChecked) {
        monitor.value.lastChecked = latestLog.timestamp || '';
      }
    }
    
    // Wait for DOM to update before rendering chart
    await nextTick();
    // Note: renderChart will be called after loading is set to false
  } catch (error: any) {
    console.error('Error fetching monitor details:', error);
    // Show user-friendly error
    if (error?.message) {
      alert(`Error loading monitor: ${error.message}`);
    }
    // If monitor not found or critical error, redirect to dashboard
    if (error?.message?.includes('not found')) {
      router.push('/');
    }
  } finally {
    loading.value = false;
    lastRefreshTime.value = new Date();
    // Force update current time to recalculate countdown immediately
    currentTime.value = new Date();
    // Now that loading is false, the canvas should be in the DOM
    // Only render chart if monitor is active and has valid data
    if (monitor.value && monitor.value.active) {
      renderChart();
    }
  }
}

// Track retry attempts to prevent infinite loops
let chartRenderRetries = 0;
const MAX_CHART_RETRIES = 3;

function renderChart() {
  console.log('renderChart called');
  console.log('chartData:', chartData.value);
  console.log('chartLabels:', chartLabels.value);
  
  // Don't render chart if monitor is not active
  if (!monitor.value || !monitor.value.active) {
    console.log('Monitor is not active, skipping chart render');
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    return;
  }
  
  const ctx = document.getElementById('responseChart') as HTMLCanvasElement;
  console.log('Canvas element:', ctx);
  if (!ctx) {
    if (chartRenderRetries < MAX_CHART_RETRIES) {
      console.warn(`Canvas element not found, retrying (attempt ${chartRenderRetries + 1}/${MAX_CHART_RETRIES})`);
      chartRenderRetries++;
      nextTick(() => renderChart());
    } else {
      console.error('Canvas element not found after maximum retries');
      chartRenderRetries = 0;
    }
    return;
  }
  
  // Reset retry counter on successful canvas find
  chartRenderRetries = 0;
  
  // If chart instance exists but canvas has changed (e.g., due to v-if), destroy it
  if (chartInstance && chartInstance.canvas !== ctx) {
    chartInstance.destroy();
    chartInstance = null;
  }
  
  if (!chartData.value || chartData.value.length === 0) {
    console.log('No chart data available');
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    return;
  }
  
  if (chartInstance) {
    console.log('Updating existing chart');
    chartInstance.data.labels = chartLabels.value;
    if (chartInstance.data.datasets[0]) {
        chartInstance.data.datasets[0].data = chartData.value;
    }
    chartInstance.update('none');
    return;
  }
  
  try {
    console.log('Creating new chart');
    chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartLabels.value,
      datasets: [{
        label: 'Response Time (ms)',
        data: chartData.value,
        borderColor: '#cb128a',
        backgroundColor: 'rgba(203,18,138,0.15)',
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5,
        borderWidth: 2,
      }]
    },
    options: {
      plugins: { 
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.7)',
          titleFont: { size: 12 },
          bodyFont: { size: 12 },
          padding: 10,
          callbacks: {
            title: function(context) {
              if (context[0]) {
                return context[0].label;
              }
              return '';
            },
            label: function(context) {
              return `Response time: ${context.raw}ms`;
            }
          }
        }
      },
      scales: {
        x: { 
          display: true,
          grid: { 
            color: 'rgba(0,0,0,0.05)' 
          },
          ticks: {
            maxTicksLimit: 10,
            color: '#666',
            font: {
              size: 10
            }
          }
        },
        y: { 
          display: true, 
          grid: { 
            color: 'rgba(0,0,0,0.05)' 
          },
          beginAtZero: true,
          ticks: {
            color: '#666'
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
    }
  });
    console.log('Chart created successfully');
  } catch (error) {
    console.error('Error creating MonitorDetail chart:', error);
  }
}

function formatDate(dateStr: string, short = false) {
  if (!dateStr) return '—';
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';

  if (short) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(date);
}

function formatInterval(seconds: number) {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
}

const statusClass = computed(() => {
  if (monitor.value.status === 'up') {
    return 'bg-green-100 text-green-800 border border-green-300';
  } else if (monitor.value.status === 'down') {
    return 'bg-red-100 text-red-800 border border-red-300';
  } else {
    return 'bg-gray-100 text-gray-800 border border-gray-300';
  }
});

const enhancedStatusClass = computed(() => {
  if (monitor.value.status === 'up') {
    return 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200';
  } else if (monitor.value.status === 'down') {
    return 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200';
  } else {
    return 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200';
  }
});

const statusDotClass = computed(() => {
  if (monitor.value.status === 'up') {
    return 'bg-emerald-500';
  } else if (monitor.value.status === 'down') {
    return 'bg-red-500';
  } else {
    return 'bg-gray-400';
  }
});

const lastResponseTime = computed(() => {
  if (!logs.value || !Array.isArray(logs.value) || logs.value.length === 0) {
    return '—';
  }
  const latestLog = logs.value[0]; // logs are sorted newest first
  if (!latestLog || latestLog.response_time_ms === undefined || latestLog.response_time_ms === null) {
    return '—';
  }
  return latestLog.response_time_ms;
});

const timeUntilNextCheck = computed(() => {
  // Check if monitor is disabled or paused - don't show countdown
  if (!monitor.value.active || (monitor.value as any).is_paused) {
    return '—';
  }
  
  if (!monitor.value.lastChecked) return '—';
  
  try {
    const lastCheck = new Date(monitor.value.lastChecked);
    const now = currentTime.value;
    const checkInterval = (monitor.value.interval_seconds || 60) * 1000; // Use actual interval in milliseconds
    const nextCheck = new Date(lastCheck.getTime() + checkInterval);
    
    if (nextCheck <= now) {
      return 'Due now';
    }
    
    const timeDiff = nextCheck.getTime() - now.getTime();
    const minutes = Math.floor(timeDiff / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  } catch (error) {
    return '—';
  }
});

function startCountdownTimer() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  // Update countdown every second
  countdownTimer = setInterval(async () => {
    const now = new Date();
    currentTime.value = now;
    
    // Skip auto-refresh logic if monitor is disabled or paused
    if (!monitor.value.active || (monitor.value as any).is_paused) {
      return;
    }
    
    // Check if we need to refresh data when stuck at "Due now"
    if (monitor.value.lastChecked) {
      const lastCheck = new Date(monitor.value.lastChecked);
      const checkInterval = (monitor.value.interval_seconds || 60) * 1000;
      const nextCheck = new Date(lastCheck.getTime() + checkInterval);
      const timeSinceRefresh = now.getTime() - lastRefreshTime.value.getTime();
      
      // If check is overdue
      if (nextCheck <= now) {
        const timeSinceDue = now.getTime() - nextCheck.getTime();
        
        // Immediate refresh: check overdue for 2+ seconds and haven't refreshed recently
        if (timeSinceDue >= 2000 && timeSinceRefresh >= 2000) {
          console.log('Immediate refresh: check overdue for 2+ seconds');
          lastRefreshTime.value = now;
          await fetchMonitorDetail();
        }
        // Regular refresh: for longer overdue periods, use more frequent checks
        else if (timeSinceDue >= 5000) {
          const minRefreshInterval = Math.max(3000, checkInterval / 4);
          if (timeSinceRefresh >= minRefreshInterval) {
            console.log('Regular refresh: check overdue for 5+ seconds');
            lastRefreshTime.value = now;
            await fetchMonitorDetail();
          }
        }
      }
    }
  }, 1000);
}

onMounted(() => {
  fetchMonitorDetail();
  startCountdownTimer();
  
  // Set up SSE connection for real-time updates
  const token = localStorage.getItem('token');
  const eventSource = new EventSource(`/api/events${token ? `?token=${encodeURIComponent(token)}` : ''}`);
  
  let lastSSEProcessTime = 0;
  const SSE_THROTTLE_MS = 2000; // Only process SSE messages every 2 seconds max
  
  eventSource.onmessage = async (event) => {
    try {
      const now = Date.now();
      const data = JSON.parse(event.data);
      
      // Throttle SSE message processing
      if (now - lastSSEProcessTime < SSE_THROTTLE_MS) {
        return; // Ignore messages that come too quickly
      }
      
      console.log('SSE message received:', data);
      if (data.type === 'check') {
        // If our specific monitor has updated, refresh the data immediately
        if (data.monitorId === Number(route.params.id) || data.monitorId === route.params.id) {
          // Skip refresh if monitor is disabled or paused
          if (!monitor.value.active || (monitor.value as any).is_paused) {
            console.log('SSE: Monitor is disabled/paused, skipping refresh');
            return;
          }
          lastSSEProcessTime = now;
          console.log('SSE: Monitor check completed, refreshing data immediately');
          lastRefreshTime.value = new Date(); // Update refresh time to prevent countdown timer conflicts
          await fetchMonitorDetail();
        }
      }
    } catch (error) {
      console.error('Error handling SSE message:', error);
    }
  };
  
  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
  };
  
  // Cleanup event source on component unmount
  onUnmounted(() => {
    eventSource.close();
    if (chartInstance) {
      chartInstance.destroy();
    }
    if (countdownTimer) {
      clearInterval(countdownTimer);
    }
  });
});
</script>

<style scoped>
</style>
