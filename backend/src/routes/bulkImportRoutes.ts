import { Router } from 'express';
import { authenticateToken } from '../utils/authMiddleware';
import {
  validateCSV,
  importCSV,
  downloadTemplate
} from '../controllers/bulkImportController';

const router = Router();

// All bulk import routes require authentication
router.use(authenticateToken);

// CSV import
router.post('/validate', validateCSV);
router.post('/import', importCSV);
router.get('/template', downloadTemplate);

export default router;
