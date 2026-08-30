export type NotificationPermission = 'granted' | 'denied' | 'default';

export interface BrowserNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  onClick?: () => void; // Separate click handler, not in data
}

class BrowserNotificationManager {
  private hasPermission = false;

  constructor() {
    this.checkPermission();
  }

  isSupported(): boolean {
    return 'Notification' in window;
  }

  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission as NotificationPermission;
  }

  private checkPermission(): void {
    this.hasPermission = this.getPermission() === 'granted';
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('Browser notifications are not supported');
      return 'denied';
    }

    if (this.getPermission() === 'granted') {
      this.hasPermission = true;
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      return permission as NotificationPermission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  async show(options: BrowserNotificationOptions, force = false): Promise<Notification | null> {
    if (!this.isSupported()) {
      console.warn('Browser notifications not supported');
      return null;
    }

    if (!force && (document.hasFocus() || document.visibilityState === 'visible')) {
      console.log('Tab is focused, skipping browser notification');
      return null;
    }

    if (this.getPermission() !== 'granted') {
      console.warn('Browser notification permission not granted');
      return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag, // Prevents duplicate notifications with same tag
        data: options.data, // Only store serializable data
        requireInteraction: options.requireInteraction || false,
      });

      notification.onshow = () => {
        console.log('Notification shown:', options.title);
      };

      notification.onerror = (error) => {
        console.error('Notification error:', error);
      };

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();

        if (options.onClick) {
          options.onClick();
        }
      };

      return notification;
    } catch (error) {
      console.error('Error showing browser notification:', error);
      return null;
    }
  }

  async showMonitorAlert(monitorName: string, status: string, monitorId?: string, force = false): Promise<Notification | null> {
    return this.show({
      title: `Monitor Alert: ${monitorName}`,
      body: `Status changed to ${status}`,
      tag: `monitor-${monitorId}`,
      data: {
        type: 'monitor-alert',
        monitorId
      },
      onClick: () => {
        if (monitorId) {
          window.location.href = `/monitor/${monitorId}`;
        }
      }
    }, force);
  }

  async showGenericNotification(title: string, message: string, notificationId?: number, force = false): Promise<Notification | null> {
    return this.show({
      title,
      body: message,
      tag: notificationId ? `notification-${notificationId}` : undefined,
      data: {
        type: 'generic',
        notificationId
      },
      onClick: () => {
        window.location.href = '/notifications';
      }
    }, force);
  }
}

export const browserNotifications = new BrowserNotificationManager();
