import { AppDataSource } from '../utils/data-source';
import { UserNotification, NotificationType } from '../models/UserNotification';
import { In } from 'typeorm';

export class NotificationService {
  // A repository fetched once at class-field-init time (which, for the
  // module-level `notificationService` singleton below, runs at import time)
  // can run before AppDataSource.initialize() completes depending on import
  // order. Every other service/controller in this codebase fetches its
  // repository fresh per method call instead - do the same here.
  private get notificationRepository() {
    return AppDataSource.getRepository(UserNotification);
  }

  async createNotification(data: {
    userId: number;
    type: NotificationType;
    title: string;
    message: string;
    relatedMonitorId?: string;
    actionUrl?: string;
  }): Promise<UserNotification> {
    const notification = this.notificationRepository.create({
      user_id: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      related_monitor_id: data.relatedMonitorId,
      action_url: data.actionUrl
    });

    await this.notificationRepository.save(notification);
    return notification;
  }

  async getUserNotifications(
    userId: number,
    filters?: { type?: NotificationType; isRead?: boolean }
  ): Promise<UserNotification[]> {
    const where: any = { user_id: userId };

    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.isRead !== undefined) {
      where.is_read = filters.isRead;
    }

    const notifications = await this.notificationRepository.find({
      where,
      relations: ['relatedMonitor'],
      order: { created_at: 'DESC' }
    });

    return notifications;
  }

  async getNotificationsByType(userId: number, type: NotificationType): Promise<UserNotification[]> {
    return this.getUserNotifications(userId, { type });
  }

  async getUnreadCount(userId: number): Promise<number> {
    return await this.notificationRepository.count({
      where: {
        user_id: userId,
        is_read: false
      }
    });
  }

  async markAsRead(notificationId: number, userId: number): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, user_id: userId }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.is_read = true;
    await this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository
      .createQueryBuilder()
      .update(UserNotification)
      .set({ is_read: true })
      .where('user_id = :userId AND is_read = false', { userId })
      .execute();
  }

  async deleteNotification(notificationId: number, userId: number): Promise<void> {
    const result = await this.notificationRepository.delete({
      id: notificationId,
      user_id: userId
    });

    if (result.affected === 0) {
      throw new Error('Notification not found');
    }
  }

  async deleteNotifications(notificationIds: number[], userId: number): Promise<void> {
    await this.notificationRepository.delete({
      id: In(notificationIds),
      user_id: userId
    });
  }

  async clearOldNotifications(userId: number, daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .from(UserNotification)
      .where('user_id = :userId AND created_at < :cutoffDate', { userId, cutoffDate })
      .execute();

    return result.affected || 0;
  }

  async createStatusNotification(
    userId: number,
    monitorId: string,
    monitorName: string,
    status: 'up' | 'down'
  ): Promise<UserNotification> {
    const type = NotificationType.ALERT;
    const title = status === 'down' ? 'Monitor Down' : 'Monitor Recovered';
    const message = `Monitor "${monitorName}" is now ${status.toUpperCase()}`;

    return this.createNotification({
      userId,
      type,
      title,
      message,
      relatedMonitorId: monitorId,
      actionUrl: `/monitors/${monitorId}`
    });
  }
}

export const notificationService = new NotificationService();
