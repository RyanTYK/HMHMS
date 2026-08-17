/**
 * Accept a team invite
 * POST /api/teams/:id/accept-invite
 */
export async function acceptInvite(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const teamId = parseInt(req.params.id);
    const member = await teamService.acceptInvite(teamId, userId);
    res.json({ success: true, data: member });
  } catch (error: any) {
    console.error('Accept invite error:', error);
    const status = error.message === 'No pending invite found' ? 404
      : error.message === 'Unauthorized' ? 401
      : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to accept invite' });
  }
}
import { Request, Response } from 'express';
import { teamService } from '../services/teamService';
import { TeamMemberRole } from '../models/TeamMember';

/**
 * Create a new team
 * POST /api/teams
 */
export async function createTeam(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Team name is required' });
    }

    const team = await teamService.createTeam(userId, name, description);
    res.status(201).json({ success: true, data: team });
  } catch (error: any) {
    console.error('Create team error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create team' });
  }
}

/**
 * Get all teams for current user
 * GET /api/teams
 */
export async function getTeams(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const teams = await teamService.getUserTeams(userId);
    res.json({ success: true, data: teams });
  } catch (error: any) {
    console.error('Get teams error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to get teams' });
  }
}

/**
 * Get team by ID
 * GET /api/teams/:id
 */
export async function getTeam(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const teamId = parseInt(req.params.id);

    const team = await teamService.getTeamById(teamId, userId);
    
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    res.json({ success: true, data: team });
  } catch (error: any) {
    console.error('Get team error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to get team' });
  }
}

/**
 * Update team
 * PUT /api/teams/:id
 */
export async function updateTeam(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const teamId = parseInt(req.params.id);
    const { name, description } = req.body;

    const team = await teamService.updateTeam(teamId, userId, { name, description });
    res.json({ success: true, data: team });
  } catch (error: any) {
    console.error('Update team error:', error);
    const status = error.message === 'Insufficient permissions' ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to update team' });
  }
}

/**
 * Delete team
 * DELETE /api/teams/:id
 */
export async function deleteTeam(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const teamId = parseInt(req.params.id);

    await teamService.deleteTeam(teamId, userId);
    res.json({ success: true, message: 'Team deleted successfully' });
  } catch (error: any) {
    console.error('Delete team error:', error);
    const status = error.message.includes('owner') ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to delete team' });
  }
}

/**
 * Add member to team
 * POST /api/teams/:id/members
 */
export async function addTeamMember(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const teamId = parseInt(req.params.id);
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const memberRole = role || TeamMemberRole.MEMBER;
    const member = await teamService.addMember(teamId, userId, email, memberRole);
    
    res.status(201).json({ success: true, data: member });
  } catch (error: any) {
    console.error('Add team member error:', error);
    const status = error.message === 'Insufficient permissions' ? 403 : 
                   error.message === 'User not found' ? 404 : 400;
    res.status(status).json({ success: false, error: error.message || 'Failed to add member' });
  }
}

/**
 * Remove member from team
 * DELETE /api/teams/:id/members/:userId
 */
export async function removeTeamMember(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const teamId = parseInt(req.params.id);
    const memberIdToRemove = parseInt(req.params.memberId);

    await teamService.removeMember(teamId, userId, memberIdToRemove);
    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error: any) {
    console.error('Remove team member error:', error);
    const status = error.message.includes('permissions') || error.message.includes('owner') ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to remove member' });
  }
}

/**
 * Update member role
 * PUT /api/teams/:id/members/:userId
 */
export async function updateTeamMemberRole(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const teamId = parseInt(req.params.id);
    const memberIdToUpdate = parseInt(req.params.memberId);
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, error: 'Role is required' });
    }

    const member = await teamService.updateMemberRole(teamId, userId, memberIdToUpdate, role);
    res.json({ success: true, data: member });
  } catch (error: any) {
    console.error('Update member role error:', error);
    const status = error.message.includes('owner') ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to update role' });
  }
}

/**
 * Get team members
 * GET /api/teams/:id/members
 */
export async function getTeamMembers(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const teamId = parseInt(req.params.id);

    const members = await teamService.getTeamMembers(teamId, userId);
    res.json({ success: true, data: members });
  } catch (error: any) {
    console.error('Get team members error:', error);
    const status = error.message === 'Not a team member' ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to get members' });
  }
}

/**
 * Get team monitors
 * GET /api/teams/:id/monitors
 */
export async function getTeamMonitors(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const teamId = parseInt(req.params.id);

    // Verify user is a team member
    await teamService.getTeamMembers(teamId, userId);

    // Get monitors for this team
    const { AppDataSource } = require('../utils/data-source');
    const { Monitor } = require('../models/Monitor');
    const { CheckLog } = require('../models/CheckLog');
    const monitorRepository = AppDataSource.getRepository(Monitor);
    const logRepo = AppDataSource.getRepository(CheckLog);

    const monitors = await monitorRepository.find({
      where: { team_id: teamId },
      order: { created_at: 'DESC' }
    });

    // Attach last status and last_check timestamp
    const withStatus = await Promise.all(
      monitors.map(async (m: any) => {
        const last = await logRepo.findOne({ where: { monitor_id: m.id }, order: { timestamp: 'DESC' } });
        return {
          ...m,
          last_check: last?.timestamp || null,
          last_status: last?.status || null,
        };
      })
    );

    res.json({ success: true, data: withStatus });
  } catch (error: any) {
    console.error('Get team monitors error:', error);
    const status = error.message === 'Not a team member' ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to get monitors' });
  }
}

/**
 * Get single team monitor
 * GET /api/teams/:id/monitors/:monitorId
 */
export async function getTeamMonitor(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const teamId = parseInt(req.params.id);
    const monitorId = req.params.monitorId;

    // Verify user is a team member
    await teamService.getTeamMembers(teamId, userId);

    const { AppDataSource } = require('../utils/data-source');
    const { Monitor } = require('../models/Monitor');
    const { CheckLog } = require('../models/CheckLog');
    const monitorRepository = AppDataSource.getRepository(Monitor);
    const logRepo = AppDataSource.getRepository(CheckLog);

    const monitor = await monitorRepository.findOne({
      where: { id: monitorId, team_id: teamId }
    });

    if (!monitor) {
      return res.status(404).json({ success: false, error: 'Monitor not found' });
    }

    // Get the latest log entry
    const lastLog = await logRepo.findOne({
      where: { monitor_id: monitor.id },
      order: { timestamp: 'DESC' }
    });

    const result = {
      ...monitor,
      lastChecked: lastLog?.timestamp || null,
      status: lastLog?.status || 'unknown'
    };

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Get team monitor error:', error);
    const status = error.message === 'Not a team member' ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to get monitor' });
  }
}

/**
 * Create team monitor
 * POST /api/teams/:id/monitors
 */
export async function createTeamMonitor(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const teamId = parseInt(req.params.id);
    const { name, type, target, port, interval_seconds, timeout_ms, active, tags, dependency, email_recipients, notify_owner } = req.body || {};

    // Check permissions (Owner/Admin only)
    const members = await teamService.getTeamMembers(teamId, userId);
    const currentMember = members.find(m => m.user_id === userId);
    if (!currentMember || (currentMember.role !== TeamMemberRole.OWNER && currentMember.role !== TeamMemberRole.ADMIN)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions. Only Owner/Admin can create monitors.' });
    }

    // Validate input
    if (!name || !type || !target) {
      return res.status(400).json({ success: false, error: 'name, type, target are required' });
    }
    if (!['http', 'tcp', 'ping', 'smb'].includes(type)) {
      return res.status(400).json({ success: false, error: 'invalid type' });
    }
    if (type === 'tcp' && !port) {
      return res.status(400).json({ success: false, error: 'port required for tcp monitors' });
    }

    const { AppDataSource } = require('../utils/data-source');
    const { Monitor } = require('../models/Monitor');
    const { v4: uuidv4 } = require('uuid');
    const { runCheck } = require('../services/checkEngine');
    const { sseManager } = require('../utils/sseManager');

    const monitorRepository = AppDataSource.getRepository(Monitor);

    const monitor = monitorRepository.create({
      id: uuidv4(),
      user_id: userId,
      team_id: teamId,
      name,
      type,
      target,
      port: port ?? null,
      interval_seconds: interval_seconds ?? 60,
      timeout_ms: timeout_ms ?? 5000,
      active: active ?? true,
      tags: tags ?? null,
      dependency: dependency ?? null,
      email_recipients: email_recipients ?? null,
      notify_owner: notify_owner ?? true,
    });

    await monitorRepository.save(monitor);

    // Perform initial check
    try {
      console.log(`Performing initial check for new team monitor ${monitor.id} (${monitor.name})`);
      await runCheck(monitor);
      console.log(`Initial check completed for ${monitor.id}`);
    } catch (e: any) {
      console.error(`Initial check failed for ${monitor.id}:`, e.message);
    }

    // Set last_check to now
    try {
      monitor.last_check = new Date();
      await monitorRepository.save(monitor);
    } catch (err: any) {
      console.error(`Failed to set last_check for new team monitor ${monitor.id}:`, err?.message || err);
    }

    // Broadcast to team
    setTimeout(() => sseManager.broadcastTeamMonitors(teamId), 100);

    res.status(201).json({ success: true, data: monitor });
  } catch (error: any) {
    console.error('Create team monitor error:', error);
    const status = error.message === 'Not a team member' ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to create monitor' });
  }
}

/**
 * Update team monitor
 * PUT /api/teams/:id/monitors/:monitorId
 */
export async function updateTeamMonitor(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const teamId = parseInt(req.params.id);
    const monitorId = req.params.monitorId;

    // Check permissions (Owner/Admin only)
    const members = await teamService.getTeamMembers(teamId, userId);
    const currentMember = members.find(m => m.user_id === userId);
    if (!currentMember || (currentMember.role !== TeamMemberRole.OWNER && currentMember.role !== TeamMemberRole.ADMIN)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions. Only Owner/Admin can update monitors.' });
    }

    const { AppDataSource } = require('../utils/data-source');
    const { Monitor } = require('../models/Monitor');
    const { sseManager } = require('../utils/sseManager');
    const monitorRepository = AppDataSource.getRepository(Monitor);

    const monitor = await monitorRepository.findOne({
      where: { id: monitorId, team_id: teamId }
    });

    if (!monitor) {
      return res.status(404).json({ success: false, error: 'Monitor not found' });
    }

    const body = req.body || {};
    if (body.type && !['http', 'tcp', 'ping', 'smb'].includes(body.type)) {
      return res.status(400).json({ success: false, error: 'invalid type' });
    }
    if ((body.type === 'tcp' || monitor.type === 'tcp') && body.port === undefined && monitor.port == null) {
      return res.status(400).json({ success: false, error: 'port required for tcp monitors' });
    }

    monitorRepository.merge(monitor, body);
    await monitorRepository.save(monitor);

    // Broadcast to team
    setTimeout(() => sseManager.broadcastTeamMonitors(teamId), 100);

    res.json({ success: true, data: monitor });
  } catch (error: any) {
    console.error('Update team monitor error:', error);
    const status = error.message === 'Not a team member' ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to update monitor' });
  }
}

/**
 * Delete team monitor
 * DELETE /api/teams/:id/monitors/:monitorId
 */
export async function deleteTeamMonitor(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const teamId = parseInt(req.params.id);
    const monitorId = req.params.monitorId;

    // Check permissions (Owner/Admin only)
    const members = await teamService.getTeamMembers(teamId, userId);
    const currentMember = members.find(m => m.user_id === userId);
    if (!currentMember || (currentMember.role !== TeamMemberRole.OWNER && currentMember.role !== TeamMemberRole.ADMIN)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions. Only Owner/Admin can delete monitors.' });
    }

    const { AppDataSource } = require('../utils/data-source');
    const { Monitor } = require('../models/Monitor');
    const { sseManager } = require('../utils/sseManager');
    const monitorRepository = AppDataSource.getRepository(Monitor);

    const monitor = await monitorRepository.findOne({
      where: { id: monitorId, team_id: teamId }
    });

    if (!monitor) {
      return res.status(404).json({ success: false, error: 'Monitor not found' });
    }

    await monitorRepository.remove(monitor);

    // Broadcast to team
    setTimeout(() => sseManager.broadcastTeamMonitors(teamId), 100);

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete team monitor error:', error);
    const status = error.message === 'Not a team member' ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to delete monitor' });
  }
}

/**
 * Check team monitor now
 * POST /api/teams/:id/monitors/:monitorId/check-now
 */
export async function teamCheckNow(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const teamId = parseInt(req.params.id);
    const monitorId = req.params.monitorId;

    // Check permissions (Owner/Admin only)
    const members = await teamService.getTeamMembers(teamId, userId);
    const currentMember = members.find(m => m.user_id === userId);
    if (!currentMember || (currentMember.role !== TeamMemberRole.OWNER && currentMember.role !== TeamMemberRole.ADMIN)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions. Only Owner/Admin can trigger checks.' });
    }

    const { AppDataSource } = require('../utils/data-source');
    const { Monitor } = require('../models/Monitor');
    const { runCheck } = require('../services/checkEngine');
    const { sseManager } = require('../utils/sseManager');
    const monitorRepository = AppDataSource.getRepository(Monitor);

    const monitor = await monitorRepository.findOne({
      where: { id: monitorId, team_id: teamId }
    });

    if (!monitor) {
      return res.status(404).json({ success: false, error: 'Monitor not found' });
    }

    try {
      console.log(`Manual check for team monitor ${monitor.id} (${monitor.name})`);
      await runCheck(monitor);
      console.log(`Check completed for ${monitor.id}`);

      // Broadcast to team
      setTimeout(() => sseManager.broadcastTeamMonitors(teamId), 100);

      res.json({ success: true, message: 'Check completed' });
    } catch (e: any) {
      console.error(`Check failed for ${monitor.id}:`, e.message);

      // Still broadcast
      setTimeout(() => sseManager.broadcastTeamMonitors(teamId), 100);

      res.status(500).json({ success: false, error: e?.message || 'Failed to run check' });
    }
  } catch (error: any) {
    console.error('Team check now error:', error);
    const status = error.message === 'Not a team member' ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to trigger check' });
  }
}

/**
 * Send a test notification email for a team monitor
 * POST /api/teams/:id/monitors/:monitorId/send-test-email
 */
export async function teamSendTestEmail(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const teamId = parseInt(req.params.id);
    const monitorId = req.params.monitorId;

    // Check permissions (Owner/Admin only), consistent with teamCheckNow
    const members = await teamService.getTeamMembers(teamId, userId);
    const currentMember = members.find(m => m.user_id === userId);
    if (!currentMember || (currentMember.role !== TeamMemberRole.OWNER && currentMember.role !== TeamMemberRole.ADMIN)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions. Only Owner/Admin can send test emails.' });
    }

    const { AppDataSource } = require('../utils/data-source');
    const { Monitor } = require('../models/Monitor');
    const { User } = require('../models/User');
    const { sendTestNotificationEmail } = require('../services/checkEngine');

    const monitorRepository = AppDataSource.getRepository(Monitor);
    const monitor = await monitorRepository.findOne({
      where: { id: monitorId, team_id: teamId }
    });

    if (!monitor) {
      return res.status(404).json({ success: false, error: 'Monitor not found' });
    }

    const emailList: string[] = [];

    if (monitor.notify_owner) {
      const owner = await AppDataSource.getRepository(User).findOne({ where: { id: monitor.user_id } });
      if (owner?.email) emailList.push(owner.email);
    }

    if (monitor.email_recipients) {
      emailList.push(
        ...monitor.email_recipients.split(',').map((e: string) => e.trim()).filter((e: string) => e)
      );
    }

    if (emailList.length === 0) {
      return res.status(400).json({ success: false, error: 'No email recipients configured for this monitor' });
    }

    for (const email of emailList) {
      await sendTestNotificationEmail(monitor, email);
    }

    res.json({ success: true, ok: true, sent: emailList.length });
  } catch (error: any) {
    console.error('Team send test email error:', error);
    const status = error.message === 'Not a team member' ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to send test email' });
  }
}

/**
 * Get team monitor logs
 * GET /api/teams/:id/monitors/:monitorId/logs
 */
export async function getTeamMonitorLogs(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const teamId = parseInt(req.params.id);
    const monitorId = req.params.monitorId;
    const { range, limit } = req.query as any;

    // Verify user is a team member (all active members can read)
    await teamService.getTeamMembers(teamId, userId);

    const { AppDataSource } = require('../utils/data-source');
    const { Monitor } = require('../models/Monitor');
    const { CheckLog } = require('../models/CheckLog');
    const monitorRepository = AppDataSource.getRepository(Monitor);
    const logRepo = AppDataSource.getRepository(CheckLog);

    // Verify monitor belongs to team
    const exists = await monitorRepository.exists({
      where: { id: monitorId, team_id: teamId }
    });

    if (!exists) {
      return res.status(404).json({ success: false, error: 'Monitor not found' });
    }

    const qb = logRepo
      .createQueryBuilder('log')
      .where('log.monitor_id = :monitorId', { monitorId })
      .orderBy('log.timestamp', 'ASC');

    if (range) {
      const now = new Date();
      let fromDate;
      if (range === '1h') fromDate = new Date(now.getTime() - 60 * 60 * 1000);
      else if (range === '6h') fromDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      else if (range === '24h') fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      else if (range === '7d') fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      if (fromDate) {
        qb.andWhere('log.timestamp >= :fromDate', { fromDate });
      }
    }

    if (limit) {
      qb.limit(Number(limit));
    } else {
      if (!range) qb.limit(100);
    }

    const rows = await qb.getMany();
    res.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Get team monitor logs error:', error);
    const status = error.message === 'Not a team member' ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to get logs' });
  }
}

/**
 * Get team monitor response history
 * GET /api/teams/:id/monitors/:monitorId/response-history
 */
export async function getTeamMonitorResponseHistory(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const teamId = parseInt(req.params.id);
    const monitorId = req.params.monitorId;
    const { range } = req.query as any;

    // Verify user is a team member (all active members can read)
    await teamService.getTeamMembers(teamId, userId);

    const { AppDataSource } = require('../utils/data-source');
    const { Monitor } = require('../models/Monitor');
    const { CheckLog } = require('../models/CheckLog');
    const monitorRepository = AppDataSource.getRepository(Monitor);
    const logRepo = AppDataSource.getRepository(CheckLog);

    // Verify monitor belongs to team
    const exists = await monitorRepository.exists({
      where: { id: monitorId, team_id: teamId }
    });

    if (!exists) {
      return res.status(404).json({ success: false, error: 'Monitor not found' });
    }

    const qb = logRepo
      .createQueryBuilder('log')
      .where('log.monitor_id = :monitorId', { monitorId })
      .andWhere('log.response_time_ms IS NOT NULL')
      .orderBy('log.timestamp', 'ASC');

    if (range) {
      const now = new Date();
      let fromDate;
      if (range === '1h') fromDate = new Date(now.getTime() - 60 * 60 * 1000);
      else if (range === '6h') fromDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      else if (range === '24h') fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      else if (range === '7d') fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      else if (range === '30d') fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      if (fromDate) {
        qb.andWhere('log.timestamp >= :fromDate', { fromDate });
      }
    } else {
      qb.limit(100);
    }

    const logs = await qb.getMany();

    const history = logs.map((log: any) => ({
      timestamp: log.timestamp,
      responseTime: log.response_time_ms,
      status: log.status
    }));

    res.json({ success: true, data: { history } });
  } catch (error: any) {
    console.error('Get team monitor response history error:', error);
    const status = error.message === 'Not a team member' ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to get response history' });
  }
}

/**
 * Bulk import team monitors
 * POST /api/teams/:id/monitors/bulk-import
 */
export async function teamBulkImport(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const teamId = parseInt(req.params.id);
    const monitors = req.body || [];

    // Check permissions (Owner/Admin only)
    const members = await teamService.getTeamMembers(teamId, userId);
    const currentMember = members.find(m => m.user_id === userId);
    if (!currentMember || (currentMember.role !== TeamMemberRole.OWNER && currentMember.role !== TeamMemberRole.ADMIN)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions. Only Owner/Admin can bulk import.' });
    }

    if (!Array.isArray(monitors)) {
      return res.status(400).json({ success: false, error: 'Expected array of monitors' });
    }

    const { AppDataSource } = require('../utils/data-source');
    const { Monitor } = require('../models/Monitor');
    const { v4: uuidv4 } = require('uuid');
    const { runCheck } = require('../services/checkEngine');
    const { sseManager } = require('../utils/sseManager');
    const monitorRepository = AppDataSource.getRepository(Monitor);

    const results = { created: 0, errors: [] as string[] };

    for (const monitorData of monitors) {
      try {
        const { name, type, target, port, interval_seconds, timeout_ms, active, tags, dependency, email_recipients } = monitorData;
        if (!name || !type || !target) {
          results.errors.push(`Monitor ${JSON.stringify(monitorData)}: name, type, target are required`);
          continue;
        }
        if (!['http', 'tcp', 'ping', 'smb'].includes(type)) {
          results.errors.push(`Monitor ${name}: invalid type ${type}`);
          continue;
        }
        if (type === 'tcp' && !port) {
          results.errors.push(`Monitor ${name}: port required for tcp monitors`);
          continue;
        }

        const monitor = monitorRepository.create({
          id: uuidv4(),
          user_id: userId,
          team_id: teamId,
          name,
          type,
          target,
          port: port ?? null,
          interval_seconds: interval_seconds ?? 60,
          timeout_ms: timeout_ms ?? 5000,
          active: active ?? true,
          tags: tags ?? null,
          dependency: dependency ?? null,
          email_recipients: email_recipients ?? null,
        });
        await monitorRepository.save(monitor);
        results.created++;

        // Run initial check asynchronously (non-blocking)
        runCheck(monitor).catch((e: any) => {
          console.error(`Initial check failed for ${monitor.id}:`, e.message);
        });
      } catch (error: any) {
        results.errors.push(`Monitor ${monitorData.name || 'unknown'}: ${error.message}`);
      }
    }

    // Broadcast to team
    setTimeout(() => sseManager.broadcastTeamMonitors(teamId), 100);

    res.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Team bulk import error:', error);
    const status = error.message === 'Not a team member' ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to bulk import' });
  }
}

/**
 * Export team monitors as CSV
 * GET /api/teams/:id/monitors/export
 */
export async function exportTeamMonitorsCSV(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const teamId = parseInt(req.params.id);

    // Check permissions (any member can export)
    const members = await teamService.getTeamMembers(teamId, userId);
    const currentMember = members.find(m => m.user_id === userId);
    if (!currentMember) {
      return res.status(403).json({ success: false, error: 'Not a team member' });
    }

    const { AppDataSource } = require('../utils/data-source');
    const { Monitor } = require('../models/Monitor');
    const monitorRepository = AppDataSource.getRepository(Monitor);

    const monitors = await monitorRepository.find({ where: { team_id: teamId } });

    const csvHeader = 'name,type,target,port,interval_seconds,timeout_ms,active,is_paused,tags,dependency,email_recipients,notify_owner,retry_interval,max_retries,notification_resend_after\n';
    const csvRows = monitors.map((m: any) =>
      `"${m.name}","${m.type}","${m.target}",${m.port || ''},${m.interval_seconds},${m.timeout_ms},${m.active},${m.is_paused || false},"${m.tags || ''}","${m.dependency || ''}","${m.email_recipients || ''}",${m.notify_owner ?? true},${m.retry_interval || 60},${m.max_retries || 3},${m.notification_resend_after || 180}`
    ).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="team-${teamId}-monitors.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Team export CSV error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to export team monitors' });
  }
}
