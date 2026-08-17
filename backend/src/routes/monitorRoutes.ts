import { Router } from 'express';
import { 
  getMonitors, 
  getMonitor, 
  createMonitor, 
  updateMonitor, 
  deleteMonitor, 
  getLogs, 
  checkNow, 
  bulkImport, 
  exportCSV, 
  sendTestEmail, 
  verifySMTP,
  pauseMonitor,
  resumeMonitor,
  getResponseHistory,
  sendManualNotification
} from '../controllers/monitorController';
import { authenticateToken } from '../utils/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// All monitor routes require authentication
router.use(authenticateToken);

router.get('/', asyncHandler(getMonitors));
router.get('/:id', asyncHandler(getMonitor));
router.get('/:id/logs', asyncHandler(getLogs));
router.get('/:id/response-history', asyncHandler(getResponseHistory));
router.post('/', asyncHandler(createMonitor));
router.put('/:id', asyncHandler(updateMonitor));
router.delete('/:id', asyncHandler(deleteMonitor));
router.post('/:id/check-now', asyncHandler(checkNow));
router.post('/:id/pause', asyncHandler(pauseMonitor));
router.post('/:id/resume', asyncHandler(resumeMonitor));
router.post('/:id/send-test-email', asyncHandler(sendTestEmail));
router.post('/:id/send-notification', asyncHandler(sendManualNotification));
router.get('/verify/smtp', asyncHandler(verifySMTP));
router.post('/bulk-import', asyncHandler(bulkImport));
router.get('/export/csv', asyncHandler(exportCSV));

export default router;
