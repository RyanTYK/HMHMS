import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface TeamMember {
  id: number;
  user_id: number;
  team_id: number;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  owner_id: number;
  members?: TeamMember[];
  memberCount?: number;
  monitorCount?: number;
}

interface TeamsState {
  teams: Team[];
  currentTeam: Team | null;
  loading: boolean;
  error: string | null;
}

export const useTeamsStore = defineStore('teams', {
  state: (): TeamsState => ({
    teams: [],
    currentTeam: null,
    loading: false,
    error: null,
  }),

  getters: {
    getTeamById: (state) => (id: number) => {
      return state.teams.find((team) => team.id === id);
    },

    userTeams: (state) => state.teams,

    currentUserId: () => {
      const authStore = useAuthStore();
      return authStore.user?.id || null;
    },

    isTeamOwner: (state) => (teamId: number, userId: number) => {
      const team = state.teams.find((t) => t.id === teamId);
      return team?.owner_id === userId;
    },

    isTeamAdmin: (state) => (teamId: number, userId: number) => {
      const team = state.teams.find((t) => t.id === teamId);
      const member = team?.members?.find((m) => m.user_id === userId);
      return member?.role === 'owner' || member?.role === 'admin';
    },
  },

  actions: {
    async fetchTeams() {
      this.loading = true;
      this.error = null;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/teams`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch teams');
        }

        const data = await response.json();
        if (data.success) {
          this.teams = data.data;
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch teams';
        console.error('Fetch teams error:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchTeamById(id: number) {
      this.loading = true;
      this.error = null;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/teams/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch team');
        }

        const data = await response.json();
        if (data.success) {
          this.currentTeam = data.data;
          
          // Update in teams array if exists
          const index = this.teams.findIndex((t) => t.id === id);
          if (index !== -1) {
            this.teams[index] = data.data;
          }
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch team';
        console.error('Fetch team error:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createTeam(data: { name: string; description?: string }) {
      this.loading = true;
      this.error = null;
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        console.log('Creating team with data:', data);
        console.log('API URL:', `${API_URL}/api/teams`);

        const response = await fetch(`${API_URL}/api/teams`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Server error:', errorData);
          throw new Error(errorData.error || 'Failed to create team');
        }

        const result = await response.json();
        console.log('Create team result:', result);
        
        if (result.success && result.data) {
          this.teams.push(result.data);
          return result.data;
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to create team';
        console.error('Create team error:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateTeam(id: number, data: { name?: string; description?: string }) {
      this.loading = true;
      this.error = null;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/teams/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update team');
        }

        const result = await response.json();
        if (result.success) {
          const index = this.teams.findIndex((t) => t.id === id);
          if (index !== -1) {
            this.teams[index] = result.data;
          }
          if (this.currentTeam?.id === id) {
            this.currentTeam = result.data;
          }
          return result.data;
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to update team';
        console.error('Update team error:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteTeam(id: number) {
      this.loading = true;
      this.error = null;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/teams/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete team');
        }

        const result = await response.json();
        if (result.success) {
          this.teams = this.teams.filter((t) => t.id !== id);
          if (this.currentTeam?.id === id) {
            this.currentTeam = null;
          }
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to delete team';
        console.error('Delete team error:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async addMember(teamId: number, email: string, role: 'admin' | 'member' = 'member') {
      this.loading = true;
      this.error = null;
      try {
        const token = localStorage.getItem('token');
        
        console.log(`Adding member to team ${teamId}: ${email} as ${role}`);
        
        const response = await fetch(`${API_URL}/api/teams/${teamId}/members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email, role }),
        });

        console.log('Add member response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Add member error response:', errorData);
          throw new Error(errorData.error || 'Failed to add member');
        }

        const result = await response.json();
        console.log('Add member success:', result);
        
        if (result.success && result.data) {
          return result.data;
        }
        
        return result;
        if (result.success) {
          // Refresh team data to get updated members
          await this.fetchTeamById(teamId);
          return result.data;
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to add member';
        console.error('Add member error:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async removeMember(teamId: number, userId: number) {
      this.loading = true;
      this.error = null;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/teams/${teamId}/members/${userId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to remove member');
        }

        const result = await response.json();
        if (result.success) {
          // Refresh team data to get updated members
          await this.fetchTeamById(teamId);
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to remove member';
        console.error('Remove member error:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateMemberRole(teamId: number, userId: number, role: 'admin' | 'member') {
      this.loading = true;
      this.error = null;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/teams/${teamId}/members/${userId}/role`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update member role');
        }

        const result = await response.json();
        if (result.success) {
          // Refresh team data to get updated members
          await this.fetchTeamById(teamId);
          return result.data;
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to update member role';
        console.error('Update member role error:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async getTeamMembers(teamId: number) {
      this.loading = true;
      this.error = null;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/teams/${teamId}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get team members');
        }

        const result = await response.json();
        if (result.success) {
          return result.data;
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to get team members';
        console.error('Get team members error:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async getTeamMonitors(teamId: number) {
      this.loading = true;
      this.error = null;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/teams/${teamId}/monitors`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get team monitors');
        }

        const result = await response.json();
        if (result.success) {
          return result.data;
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to get team monitors';
        console.error('Get team monitors error:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
