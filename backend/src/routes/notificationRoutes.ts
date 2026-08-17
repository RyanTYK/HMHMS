import { Router } from 'express';
import { authenticateToken } from '../utils/authMiddleware';
import {
  getNotifications,
  getNotificationsByType,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteNotifications,
  clearOldNotifications
} from '../controllers/notificationController';

const router = Router();

// All notification routes require authentication
router.use(authenticateToken);

// Notification CRUD
router.get('/', getNotifications);
router.get('/type/:type', getNotificationsByType);
router.get('/unread/count', getUnreadCount);

// Notification actions
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);
router.delete('/', deleteNotifications);
router.delete('/old/clear', clearOldNotifications);

export default router;
