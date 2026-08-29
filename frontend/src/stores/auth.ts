import { defineStore } from 'pinia';
import { useMonitorsStore } from './monitors';
import { useSSE } from '../composables/useSSE';

export type User = { 
  id: number; 
  email: string; 
  name: string;
  browser_notifications_enabled?: boolean;
};

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') as string | null,
    user: null as User | null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    async login(email: string, password: string) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
      const data = await res.json();
      this.token = data.token;
      localStorage.setItem('token', this.token!);
      await this.me();
    },
    async register(name: string, email: string, password: string) {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Register failed');
      // Auto-login after register
      await this.login(email, password);
    },
    async me() {
      if (!this.token) return;
      try {
        const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${this.token}` } });
        if (res.ok) {
          this.user = await res.json();
        } else {
          // Token is invalid - clear it
          this.logout();
          throw new Error('Invalid or expired token');
        }
      } catch (error) {
        this.logout();
        throw error;
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      
      // Clear monitors store to prevent showing previous user's data
      const monitorsStore = useMonitorsStore();
      monitorsStore.$reset();
      
      // Close SSE connection to prevent cross-user data leaks
      const { closeConnection } = useSSE();
      closeConnection();
    },
    async updateNotificationSettings(enabled: boolean) {
      if (!this.token) throw new Error('Not authenticated');
      
      const res = await fetch('/api/auth/settings/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`
        },
        body: JSON.stringify({ browser_notifications_enabled: enabled })
      });
      
      if (!res.ok) throw new Error('Failed to update notification settings');
      
      const data = await res.json();
      if (this.user) {
        this.user.browser_notifications_enabled = data.browser_notifications_enabled;
      }
    },
    
    async updateProfile(name: string) {
      if (!this.token) throw new Error('Not authenticated');
      
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`
        },
        body: JSON.stringify({ name })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update profile');
      }
      
      const data = await res.json();
      if (this.user) {
        this.user.name = data.name;
      }
    },
    
    // Microsoft SSO methods
    initiateMicrosoftSSO() {
      window.location.href = '/api/auth/microsoft';
    },
    
    async setTokenAndFetchUser(token: string) {
      this.token = token;
      localStorage.setItem('token', token);
      await this.me();
    }
  }
});
