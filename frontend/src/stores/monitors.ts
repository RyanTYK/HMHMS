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
  team_id?: number | null;
};

interface MonitorsState {
  personal: {
    monitors: Monitor[];
    loading: boolean;
    error: string | null;
  };
  teams: {
    [teamId: number]: {
      monitors: Monitor[];
      loading: boolean;
      error: string | null;
    };
  };
}

export const useMonitorsStore = defineStore('monitors', {
  state: (): MonitorsState => ({
    personal: {
      monitors: [],
      loading: false,
      error: null
    },
    teams: {}
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

    // Team monitor actions
    async fetchTeamMonitors(teamId: number) {
      if (!this.teams[teamId]) {
        this.teams[teamId] = { monitors: [], loading: false, error: null };
      }
      
      this.teams[teamId].loading = true;
      this.teams[teamId].error = null;
      
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/teams/${teamId}/monitors`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error('Failed to fetch team monitors');
        const data = await res.json();
        this.teams[teamId].monitors = data.data || data;
      } catch (error: any) {
        this.teams[teamId].error = error.message;
        throw error;
      } finally {
        this.teams[teamId].loading = false;
      }
    },

    async createTeamMonitor(teamId: number, payload: Partial<Monitor>) {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/teams/${teamId}/monitors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create team monitor');
      }
      
      // Wait for initial check, then fetch
      setTimeout(async () => {
        await this.fetchTeamMonitors(teamId);
      }, 2000);
      
      await this.fetchTeamMonitors(teamId);
    },

    async updateTeamMonitor(teamId: number, monitorId: string, payload: Partial<Monitor>) {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/teams/${teamId}/monitors/${monitorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update team monitor');
      }
      await this.fetchTeamMonitors(teamId);
    },

    async deleteTeamMonitor(teamId: number, monitorId: string) {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/teams/${teamId}/monitors/${monitorId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete team monitor');
      }
      if (this.teams[teamId]) {
        this.teams[teamId].monitors = this.teams[teamId].monitors.filter(m => m.id !== monitorId);
      }
    },

    async checkTeamMonitorNow(teamId: number, monitorId: string) {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/teams/${teamId}/monitors/${monitorId}/check-now`, { 
        method: 'POST', 
        headers: token ? { Authorization: `Bearer ${token}` } : {} 
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to trigger check');
      }
    },

    async getTeamMonitorLogs(teamId: number, monitorId: string, range = '1h') {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/teams/${teamId}/monitors/${monitorId}/logs?range=${range}`, { 
        headers: token ? { Authorization: `Bearer ${token}` } : {} 
      });
      if (!res.ok) return [] as any[];
      const data = await res.json();
      return data.data || data;
    },

    async getTeamMonitorResponseHistory(teamId: number, monitorId: string, range = '24h') {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/teams/${teamId}/monitors/${monitorId}/response-history?range=${range}`, { 
        headers: token ? { Authorization: `Bearer ${token}` } : {} 
      });
      if (!res.ok) return { history: [] };
      const data = await res.json();
      return data.data || data;
    },

    async bulkImportTeamMonitors(teamId: number, monitors: Partial<Monitor>[]) {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/teams/${teamId}/monitors/bulk-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(monitors),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to bulk import');
      }
      const result = await res.json();
      
      // Refresh team monitors
      await this.fetchTeamMonitors(teamId);
      
      return result.data || result;
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
