import { defineStore } from 'pinia';

export enum ShareRole {
  VIEWER = 'viewer',
  EDITOR = 'editor'
}

export enum ShareStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined'
}

export interface Share {
  id: number;
  monitor_id: string;
  shared_by: number;
  shared_with_user?: number;
  shared_with_team?: number;
  role: ShareRole;
  status: ShareStatus;
  shared_at: string;
  responded_at?: string;
  monitor?: {
    id: string;
    name: string;
    type: string;
    target: string;
    status?: string;
  };
  sharedBy?: {
    id: number;
    username: string;
    email: string;
  };
  sharedWithUser?: {
    id: number;
    username: string;
    email: string;
  };
  sharedWithTeam?: {
    id: number;
    name: string;
  };
}

interface SharesState {
  sentShares: Share[];
  receivedShares: Share[];
  loading: boolean;
}

export const useSharesStore = defineStore('shares', {
  state: (): SharesState => ({
    sentShares: [],
    receivedShares: [],
    loading: false
  }),

  getters: {
    pendingReceivedShares: (state) => 
      state.receivedShares.filter(s => s.status === ShareStatus.PENDING),
    acceptedReceivedShares: (state) => 
      state.receivedShares.filter(s => s.status === ShareStatus.ACCEPTED),
    pendingSentShares: (state) => 
      state.sentShares.filter(s => s.status === ShareStatus.PENDING),
  },

  actions: {
    async shareMonitor(monitorId: string, shareWith: { email?: string; userId?: number; teamId?: number }, role: ShareRole = ShareRole.VIEWER) {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/shares', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ monitorId, ...shareWith, role })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to share monitor');
      }

      const data = await response.json();
      return data.share;
    },

    async fetchSentShares() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/shares/sent', {
          headers: { 
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });

        if (!response.ok) throw new Error('Failed to fetch sent shares');

        const data = await response.json();
        this.sentShares = data.shares;
      } finally {
        this.loading = false;
      }
    },

    async fetchReceivedShares() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/shares/received', {
          headers: { 
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });

        if (!response.ok) throw new Error('Failed to fetch received shares');

        const data = await response.json();
        this.receivedShares = data.shares;
      } finally {
        this.loading = false;
      }
    },

    async acceptShare(shareId: number) {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/shares/${shareId}/accept`, {
        method: 'POST',
        headers: { 
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to accept share');
      }

      const data = await response.json();

      // Update local state
      const share = this.receivedShares.find(s => s.id === shareId);
      if (share) {
        share.status = ShareStatus.ACCEPTED;
        share.responded_at = new Date().toISOString();
      }

      // Return the accepted share data so it can be added to monitors
      return data.share;
    },

    async declineShare(shareId: number) {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/shares/${shareId}/decline`, {
        method: 'POST',
        headers: { 
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to decline share');
      }

      // Update local state
      const share = this.receivedShares.find(s => s.id === shareId);
      if (share) {
        share.status = ShareStatus.DECLINED;
        share.responded_at = new Date().toISOString();
      }
    },

    async revokeShare(shareId: number) {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/shares/${shareId}`, {
        method: 'DELETE',
        headers: { 
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to revoke share');
      }

      // Remove from local state
      this.sentShares = this.sentShares.filter(s => s.id !== shareId);
    }
  }
});
