/**
 * Browser Notifications Utility
 * Handles browser notification permissions and displaying notifications
 */

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

  /**
   * Check if browser notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Get current notification permission status
   */
  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission as NotificationPermission;
  }

  /**
   * Check and update permission status
   */
  private checkPermission(): void {
    this.hasPermission = this.getPermission() === 'granted';
  }

  /**
   * Request notification permission from the user
   */
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

  /**
   * Show a browser notification
   * Only shows if tab is not focused and permission is granted
   */
  async show(options: BrowserNotificationOptions, force = false): Promise<Notification | null> {
    // Check if browser supports notifications
    if (!this.isSupported()) {
      console.warn('Browser notifications not supported');
      return null;
    }

    // Check if tab is focused - don't show if user is already looking at the page (unless forced)
    if (!force && (document.hasFocus() || document.visibilityState === 'visible')) {
      console.log('Tab is focused, skipping browser notification');
      return null;
    }

    // Check permission
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

      // Log when notification is shown
      notification.onshow = () => {
        console.log('Notification shown:', options.title);
      };

      // Log any errors
      notification.onerror = (error) => {
        console.error('Notification error:', error);
      };

      // Focus window when notification is clicked
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();

        // Call custom click handler if provided
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

  /**
   * Show a notification for a new monitor alert
   */
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
          // Navigate to monitor detail page
          window.location.href = `/monitor/${monitorId}`;
        }
      }
    }, force);
  }

  /**
   * Show a generic notification
   */
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

// Export singleton instance
export const browserNotifications = new BrowserNotificationManager();
