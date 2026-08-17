import { Router } from 'express';
import { login, register, me, getAllUsers, updateNotificationSettings, updateProfile, verifyEmail, resendVerificationEmail, microsoftAuth, microsoftCallback } from '../controllers/authController';
import { authenticateToken } from '../utils/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.get('/me', authenticateToken, me);
router.get('/users', authenticateToken, getAllUsers);
router.patch('/settings/notifications', authenticateToken, updateNotificationSettings);
router.patch('/profile', authenticateToken, updateProfile);

// Microsoft OAuth routes
router.get('/microsoft', microsoftAuth);
router.get('/microsoft/callback', microsoftCallback);

export default router;
