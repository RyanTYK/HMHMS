import { Router } from 'express';
import { authenticateToken } from '../utils/authMiddleware';
import {
  createTeam,
  getTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
  getTeamMembers,
  getTeamMonitors,
  getTeamMonitor,
  createTeamMonitor,
  updateTeamMonitor,
  deleteTeamMonitor,
  teamCheckNow,
  teamSendTestEmail,
  getTeamMonitorLogs,
  getTeamMonitorResponseHistory,
  teamBulkImport,
  exportTeamMonitorsCSV,
  acceptInvite
} from '../controllers/teamController';
// Accept invite


const router = Router();

// Reject non-numeric route ids up front so NaN can never reach the database layer
const validateNumericParam = (name: string) => (
  req: any,
  res: any,
  next: any,
  value: string
) => {
  if (!/^\d+$/.test(value)) {
    return res.status(400).json({ success: false, error: `Invalid ${name}` });
  }
  next();
};

router.param('id', validateNumericParam('team id'));
router.param('memberId', validateNumericParam('member id'));

// All team routes require authentication
router.use(authenticateToken);

// Accept invite (must run after authentication so req.user is populated)
router.post('/:id/accept-invite', acceptInvite);

// Team CRUD
router.post('/', createTeam);
router.get('/', getTeams);
router.get('/:id', getTeam);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);

// Team member management
router.post('/:id/members', addTeamMember);
router.delete('/:id/members/:memberId', removeTeamMember);
router.put('/:id/members/:memberId/role', updateTeamMemberRole);
router.get('/:id/members', getTeamMembers);

// Team monitors
router.get('/:id/monitors', getTeamMonitors);
router.get('/:id/monitors/export', exportTeamMonitorsCSV);
router.get('/:id/monitors/:monitorId', getTeamMonitor);
router.post('/:id/monitors', createTeamMonitor);
router.post('/:id/monitors/bulk-import', teamBulkImport);
router.put('/:id/monitors/:monitorId', updateTeamMonitor);
router.delete('/:id/monitors/:monitorId', deleteTeamMonitor);
router.post('/:id/monitors/:monitorId/check-now', teamCheckNow);
router.post('/:id/monitors/:monitorId/send-test-email', teamSendTestEmail);
router.get('/:id/monitors/:monitorId/logs', getTeamMonitorLogs);
router.get('/:id/monitors/:monitorId/response-history', getTeamMonitorResponseHistory);

export default router;
