import { defineStore } from 'pinia';

export type Monitor = {
  sparkline: never[];
  id: string;
  name: string;
  type: 'http' | 'tcp' | 'ping' | 'smb';
  target: string;
  port?: number | null;
  interval_seconds: number;
  timeout_ms: number;
  active: boolean;
  tags?: string | null;
  dependency?: string | null;
  last_check?: string | null;
  last_status?: 'up' | 'down' | null;
};

interface MonitorsState {
  personal: {
    monitors: Monitor[];
    loading: boolean;
    error: string | null;
  };
}

export const useMonitorsStore = defineStore('monitors', {
  state: (): MonitorsState => ({
    personal: {
      monitors: [],
      loading: false,
      error: null
    }
  }),
  
  actions: {
    // Personal monitor actions
    async fetchPersonalMonitors() {
      this.personal.loading = true;
      this.personal.error = null;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/monitors', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error('Failed to fetch personal monitors');
        this.personal.monitors = await res.json();
      } catch (error: any) {
        this.personal.error = error.message;
        throw error;
      } finally {
        this.personal.loading = false;
      }
    },

    async createPersonalMonitor(payload: Partial<Monitor>) {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/monitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create monitor');
      
      // Fetch immediately - SSE will handle real-time updates when check completes
      await this.fetchPersonalMonitors();
    },

    async updatePersonalMonitor(id: string, payload: Partial<Monitor>) {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/monitors/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update monitor');
      await this.fetchPersonalMonitors();
    },

    async deletePersonalMonitor(id: string) {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/monitors/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to delete monitor');
      this.personal.monitors = this.personal.monitors.filter(m => m.id !== id);
    },

    async checkPersonalMonitorNow(id: string) {
      const token = localStorage.getItem('token');
      await fetch(`/api/monitors/${id}/check-now`, { 
        method: 'POST', 
        headers: token ? { Authorization: `Bearer ${token}` } : {} 
      });
    },

    async getPersonalMonitorLogs(id: string, range = '1h') {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/monitors/${id}/logs?range=${range}`, { 
        headers: token ? { Authorization: `Bearer ${token}` } : {} 
      });
      if (!res.ok) return [] as any[];
      return await res.json();
    },

    async exportPersonalMonitorsCSV() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/monitors/export/csv', { 
          headers: token ? { Authorization: `Bearer ${token}` } : {} 
        });
        if (!response.ok) throw new Error('Export failed');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'monitors.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error: any) {
        alert('Export failed: ' + error.message);
      }
    },

    // Legacy compatibility (keep for backward compatibility with existing code)
    async fetchAll() {
      await this.fetchPersonalMonitors();
    },
    async create(payload: Partial<Monitor>) {
      await this.createPersonalMonitor(payload);
    },
    async update(id: string, payload: Partial<Monitor>) {
      await this.updatePersonalMonitor(id, payload);
    },
    async remove(id: string) {
      await this.deletePersonalMonitor(id);
    },
    async checkNow(id: string) {
      await this.checkPersonalMonitorNow(id);
    },
    async logs(id: string, range = '1h') {
      return await this.getPersonalMonitorLogs(id, range);
    },
    async exportCSV() {
      await this.exportPersonalMonitorsCSV();
    }
  },
  
  getters: {
    // Legacy getter for backward compatibility
    items: (state) => state.personal.monitors,
    loading: (state) => state.personal.loading
  }
});
