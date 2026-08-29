import { Router } from 'express';
import { login, register, me, updateNotificationSettings, updateProfile, verifyEmail, resendVerificationEmail, microsoftAuth, microsoftCallback } from '../controllers/authController';
import { authenticateToken } from '../utils/authMiddleware';
import { loginRateLimiter, registerRateLimiter, resendVerificationRateLimiter } from '../middleware/rateLimiters';

const router = Router();

router.post('/login', loginRateLimiter, login);
router.post('/register', registerRateLimiter, register);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationRateLimiter, resendVerificationEmail);
router.get('/me', authenticateToken, me);
router.patch('/settings/notifications', authenticateToken, updateNotificationSettings);
router.patch('/profile', authenticateToken, updateProfile);

// Microsoft OAuth routes
router.get('/microsoft', microsoftAuth);
router.get('/microsoft/callback', microsoftCallback);

export default router;
