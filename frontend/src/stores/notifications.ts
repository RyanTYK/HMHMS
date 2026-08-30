import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

export enum NotificationType {
  ALERT = 'alert',
  SYSTEM = 'system'
}

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  related_monitor_id?: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export const useNotificationsStore = defineStore('notifications', {
  state: (): NotificationsState => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
  }),

  getters: {
    unreadNotifications: (state) => state.notifications.filter((n) => !n.is_read),

    alertNotifications: (state) =>
      state.notifications.filter((n) => n.type === NotificationType.ALERT),
    
    systemNotifications: (state) => 
      state.notifications.filter((n) => n.type === NotificationType.SYSTEM),
  },

  actions: {
    async fetchNotifications() {
      this.loading = true;
      this.error = null;
      try {
        const authStore = useAuthStore();
        const token = authStore.token;

        const response = await fetch(`/api/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();
        this.notifications = data.notifications || [];
      } catch (error: any) {
        this.error = error.message;
        console.error('Fetch notifications error:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchUnreadCount() {
      try {
        const authStore = useAuthStore();
        const token = authStore.token;

        const response = await fetch(`/api/notifications/unread/count`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch unread count');
        }

        const data = await response.json();
        this.unreadCount = data.count || 0;
      } catch (error: any) {
        console.error('Fetch unread count error:', error);
      }
    },

    async markAsRead(notificationId: number) {
      try {
        const authStore = useAuthStore();
        const token = authStore.token;

        const response = await fetch(`/api/notifications/${notificationId}/read`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to mark notification as read');
        }

        const notification = this.notifications.find((n) => n.id === notificationId);
        if (notification) {
          notification.is_read = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
      } catch (error: any) {
        console.error('Mark as read error:', error);
        throw error;
      }
    },

    async markAllAsRead() {
      try {
        const authStore = useAuthStore();
        const token = authStore.token;

        const response = await fetch(`/api/notifications/read-all`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to mark all as read');
        }

        this.notifications.forEach((n) => (n.is_read = true));
        this.unreadCount = 0;
      } catch (error: any) {
        console.error('Mark all as read error:', error);
        throw error;
      }
    },

    async deleteNotification(notificationId: number) {
      try {
        const authStore = useAuthStore();
        const token = authStore.token;

        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete notification');
        }

        const notification = this.notifications.find((n) => n.id === notificationId);
        if (notification && !notification.is_read) {
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
        this.notifications = this.notifications.filter((n) => n.id !== notificationId);
      } catch (error: any) {
        console.error('Delete notification error:', error);
        throw error;
      }
    },
  },
});
