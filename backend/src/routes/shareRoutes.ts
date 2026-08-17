import { Router } from 'express';
import { authenticateToken } from '../utils/authMiddleware';
import {
  shareMonitor,
  getMyShares,
  getSharedWithMe,
  acceptShare,
  declineShare,
  revokeShare,
  getShare
} from '../controllers/shareController';

const router = Router();

// All share routes require authentication
router.use(authenticateToken);

// Share management
router.post('/', shareMonitor);
router.get('/sent', getMyShares);
router.get('/received', getSharedWithMe);
router.get('/:id', getShare);

// Share actions
router.post('/:id/accept', acceptShare);
router.post('/:id/decline', declineShare);
router.delete('/:id', revokeShare);

export default router;
