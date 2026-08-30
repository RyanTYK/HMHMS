import { Request, Response } from 'express';
import { notificationService } from '../services/notificationService';
import { NotificationType } from '../models/UserNotification';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { type, isRead } = req.query;

    const filters: any = {};
    if (type) {
      filters.type = type as NotificationType;
    }
    if (isRead !== undefined) {
      filters.isRead = isRead === 'true';
    }

    const notifications = await notificationService.getUserNotifications(userId, filters);

    res.json({ notifications });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch notifications' });
  }
};

export const getNotificationsByType = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { type } = req.params;

    if (!Object.values(NotificationType).includes(type as NotificationType)) {
      return res.status(400).json({ message: 'Invalid notification type' });
    }

    const notifications = await notificationService.getNotificationsByType(
      userId,
      type as NotificationType
    );

    res.json({ notifications });
  } catch (error: any) {
    console.error('Error fetching notifications by type:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch notifications' });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const count = await notificationService.getUnreadCount(userId);

    res.json({ count });
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch unread count' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    if (isNaN(notificationId)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }

    await notificationService.markAsRead(notificationId, userId);

    res.json({ message: 'Notification marked as read' });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }

    res.status(500).json({ message: error.message || 'Failed to mark notification as read' });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    await notificationService.markAllAsRead(userId);

    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ message: error.message || 'Failed to mark all as read' });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    if (isNaN(notificationId)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }

    await notificationService.deleteNotification(notificationId, userId);

    res.json({ message: 'Notification deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }

    res.status(500).json({ message: error.message || 'Failed to delete notification' });
  }
};

export const deleteNotifications = async (req: Request, res: Response) => {
  try {
    const { notificationIds } = req.body;
    const userId = (req as any).user.id;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({ message: 'Invalid notification IDs' });
    }

    await notificationService.deleteNotifications(notificationIds, userId);

    res.json({ message: 'Notifications deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting notifications:', error);
    res.status(500).json({ message: error.message || 'Failed to delete notifications' });
  }
};

export const clearOldNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const daysOld = parseInt(req.query.days as string) || 30;

    const deletedCount = await notificationService.clearOldNotifications(userId, daysOld);

    res.json({ 
      message: `Cleared ${deletedCount} old notifications`,
      deletedCount 
    });
  } catch (error: any) {
    console.error('Error clearing old notifications:', error);
    res.status(500).json({ message: error.message || 'Failed to clear old notifications' });
  }
};
