import { Request, Response } from 'express';
import { AppDataSource } from '../utils/data-source';
import { sseManager } from '../utils/sseManager';
import { Monitor } from '../models/Monitor';
import { CheckLog } from '../models/CheckLog';
import { User } from '../models/User';
import { v4 as uuidv4 } from 'uuid';
import { runCheck, sendNotification, sendTestNotificationEmail, verifySMTPTransport } from '../services/checkEngine';
import { LessThan } from 'typeorm';

export const getMonitors = async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Monitor);
  const logRepo = AppDataSource.getRepository(CheckLog);
  const userId = (req as any).user?.id as number;
  const monitors = await repo.find({ where: { user_id: userId } });
  // Attach last status and last_check timestamp
  const withStatus = await Promise.all(
    monitors.map(async (m) => {
      const last = await logRepo.findOne({ where: { monitor_id: m.id }, order: { timestamp: 'DESC' } });
      return {
        ...m,
        last_check: last?.timestamp || null,
        last_status: last?.status || null,
      };
    })
  );
  res.json(withStatus);
};

export const getMonitor = async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Monitor);
  const logRepo = AppDataSource.getRepository(CheckLog);
  const userId = (req as any).user?.id as number;
  const monitor = await repo.findOne({ where: { id: req.params.id, user_id: userId } });
  if (!monitor) return res.status(404).json({ error: 'Monitor not found' });
  
  // Get the latest log entry to include last check time and status
  const lastLog = await logRepo.findOne({ 
    where: { monitor_id: monitor.id }, 
    order: { timestamp: 'DESC' } 
  });
  
  const result = {
    ...monitor,
    lastChecked: lastLog?.timestamp || null,
    status: lastLog?.status || 'unknown'
  };
  
  res.json(result);
};

export const createMonitor = async (req: Request, res: Response) => {
  const { name, type, target, port, interval_seconds, timeout_ms, active, tags, dependency, email_recipients, notify_alert, notify_owner } = req.body || {};
  if (!name || !type || !target) return res.status(400).json({ error: 'name, type, target are required' });
  if (!['http', 'tcp', 'ping', 'smb'].includes(type)) return res.status(400).json({ error: 'invalid type' });
  if (type === 'tcp' && !port) return res.status(400).json({ error: 'port required for tcp monitors' });
  const repo = AppDataSource.getRepository(Monitor);
  const userId = (req as any).user?.id as number;
  const monitor = repo.create({
    id: uuidv4(),
    user_id: userId,
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
    notify_alert: notify_alert ?? true,
    notify_owner: notify_owner ?? true,
  });
  await repo.save(monitor);
  
  // Perform an initial check asynchronously (non-blocking) after creation
  (async () => {
    try {
      console.log(`Performing initial check for new monitor ${monitor.id} (${monitor.name})`);
      await runCheck(monitor);
      console.log(`Initial check completed for ${monitor.id}`);
      
      // Broadcast SSE update after initial check
      setTimeout(() => sseManager.broadcastMonitors(userId), 100);
    } catch (e: any) {
      console.error(`Initial check failed for ${monitor.id}:`, e.message);
      setTimeout(() => sseManager.broadcastMonitors(userId), 100);
    }

    // Ensure last_check is set to now so the scheduler doesn't immediately re-run this monitor.
    try {
      const repo = AppDataSource.getRepository(Monitor);
      monitor.last_check = new Date();
      await repo.save(monitor);
    } catch (err: any) {
      console.error(`Failed to set last_check for new monitor ${monitor.id}:`, err?.message || err);
    }
  })();
  
  // Return response immediately without waiting for check
  res.status(201).json(monitor);
};

export const updateMonitor = async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Monitor);
  const userId = (req as any).user?.id as number;
  const monitor = await repo.findOne({ where: { id: req.params.id, user_id: userId } });
  if (!monitor) return res.status(404).json({ error: 'Monitor not found' });
  const body = req.body || {};
  if (body.type && !['http', 'tcp', 'ping', 'smb'].includes(body.type)) return res.status(400).json({ error: 'invalid type' });
  if ((body.type === 'tcp' || monitor.type === 'tcp') && body.port === undefined && monitor.port == null) {
    // ensure port remains present for tcp
    return res.status(400).json({ error: 'port required for tcp monitors' });
  }
  repo.merge(monitor, body);
  await repo.save(monitor);
  res.json(monitor);
};

export const deleteMonitor = async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Monitor);
  const userId = (req as any).user?.id as number;
  const monitor = await repo.findOne({ where: { id: req.params.id, user_id: userId } });
  if (!monitor) return res.status(404).json({ error: 'Monitor not found' });
  await repo.remove(monitor);
  res.status(204).send();
};

// Send a test email to all configured recipients for a monitor
export const sendTestEmail = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Monitor);
    const userId = (req as any).user?.id as number;
    const monitor = await repo.findOne({ where: { id: req.params.id, user_id: userId } });
    if (!monitor) return res.status(404).json({ error: 'Monitor not found' });

    const emailList: string[] = [];
    
    // Add owner's email if notify_owner is enabled
    if (monitor.notify_owner) {
      const userRepo = AppDataSource.getRepository(User);
      const owner = await userRepo.findOne({ where: { id: monitor.user_id } });
      if (owner?.email) {
        emailList.push(owner.email);
      }
    }
    
    // Add additional recipients if configured
    if (monitor.email_recipients) {
      const additionalEmails = monitor.email_recipients
        .split(',')
        .map(email => email.trim())
        .filter(email => email);
      emailList.push(...additionalEmails);
    }

    if (emailList.length === 0) {
      return res.status(400).json({ error: 'No email recipients configured for this monitor' });
    }

    // Send test notifications
    for (const email of emailList) {
      await sendTestNotificationEmail(monitor, email);
    }
    return res.json({ ok: true, sent: emailList.length });
  } catch (err: any) {
    console.error('sendTestEmail error:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Failed to send test email' });
  }
};

// Verify SMTP settings (no email sent). Useful for debugging connection/auth issues.
export const verifySMTP = async (_req: Request, res: Response) => {
  const result = await verifySMTPTransport();
  if (!result.ok) return res.status(500).json({ ok: false, error: result.error });
  return res.json({ ok: true });
};

export const getLogs = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { range, limit } = req.query as any;
  const logRepo = AppDataSource.getRepository(CheckLog);
  const repo = AppDataSource.getRepository(Monitor);
  const userId = (req as any).user?.id as number;
  // Ensure the monitor belongs to this user
  const owned = await repo.exists({ where: { id, user_id: userId } });
  if (!owned) return res.status(404).json({ error: 'Monitor not found' });
  
  const qb = logRepo
    .createQueryBuilder('log')
    .where('log.monitor_id = :id', { id })
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
    // If no range is specified, limit to a reasonable number for the chart
    if (!range) qb.limit(100);
  }

  const rows = await qb.getMany();
  res.json(rows);
};

export const checkNow = async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Monitor);
  const userId = (req as any).user?.id as number;
  const monitor = await repo.findOne({ where: { id: req.params.id, user_id: userId } });
  if (!monitor) return res.status(404).json({ error: 'Monitor not found' });
  try {
    console.log(`Manual check for monitor ${monitor.id} (${monitor.name})`);
    await runCheck(monitor);
    console.log(`Check completed for ${monitor.id}`);
    
    // Broadcast check completion and monitor update after manual check
  sseManager.broadcastCheckComplete((req as any).user?.id, monitor.id);
  setTimeout(() => sseManager.broadcastMonitors((req as any).user?.id), 100);
    
    res.json({ ok: true });
  } catch (e: any) {
    console.error(`Check failed for ${monitor.id}:`, e.message);
    
    // Still broadcast check completion and monitor update with the failed check result
  sseManager.broadcastCheckComplete((req as any).user?.id, monitor.id);
  setTimeout(() => sseManager.broadcastMonitors((req as any).user?.id), 100);
    
    res.status(500).json({ error: e?.message || 'Failed to run check' });
  }
};

export const bulkImport = async (req: Request, res: Response) => {
  const monitors = req.body || [];
  if (!Array.isArray(monitors)) return res.status(400).json({ error: 'Expected array of monitors' });

  const repo = AppDataSource.getRepository(Monitor);
  const userId = (req as any).user?.id as number;
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

      const monitor = repo.create({
        id: uuidv4(),
        user_id: userId,
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
      await repo.save(monitor);
      results.created++;

      // Run initial check asynchronously (non-blocking)
      runCheck(monitor).catch(e => {
        console.error(`Initial check failed for ${monitor.id}:`, e.message);
      });
    } catch (error: any) {
      results.errors.push(`Monitor ${monitorData.name || 'unknown'}: ${error.message}`);
    }
  }

  // Broadcast SSE update after bulk import
  setTimeout(() => sseManager.broadcastMonitors(userId), 100);

  res.json(results);
};

export const exportCSV = async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Monitor);
  const userId = (req as any).user?.id as number;
  const monitors = await repo.find({ where: { user_id: userId } });

  const csvHeader = 'name,type,target,port,interval_seconds,timeout_ms,active,is_paused,tags,dependency,email_recipients,notify_owner,retry_interval,max_retries,notification_resend_after\n';
  const csvRows = monitors.map(m =>
    `"${m.name}","${m.type}","${m.target}",${m.port || ''},${m.interval_seconds},${m.timeout_ms},${m.active},${m.is_paused || false},"${m.tags || ''}","${m.dependency || ''}","${m.email_recipients || ''}",${m.notify_owner ?? true},${m.retry_interval || 60},${m.max_retries || 3},${m.notification_resend_after || 180}`
  ).join('\n');

  const csv = csvHeader + csvRows;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="monitors.csv"');
  res.send(csv);
};

export const cleanOldLogs = async (retentionDays?: number) => {
  const logRepo = AppDataSource.getRepository(CheckLog);
  const days = retentionDays || parseInt(process.env.LOG_RETENTION_DAYS || '7');
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  try {
    const result = await logRepo.delete({ timestamp: LessThan(cutoffDate) });
    console.log(`[MonitorController] Cleaned ${result.affected || 0} log entries older than ${days} days (cutoff: ${cutoffDate.toISOString()})`);
    return result.affected || 0;
  } catch (error) {
    console.error('[MonitorController] Error cleaning old logs:', error);
    throw error;
  }
};

/**
 * Pause a monitor
 */
export const pauseMonitor = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Monitor);
    const userId = (req as any).user?.id as number;
    const monitor = await repo.findOne({ where: { id: req.params.id, user_id: userId } });
    
    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    monitor.is_paused = true;
    await repo.save(monitor);
    
    sseManager.broadcastMonitors(userId);
    
    res.json({ message: 'Monitor paused successfully', monitor });
  } catch (error: any) {
    console.error('Error pausing monitor:', error);
    res.status(500).json({ error: error.message || 'Failed to pause monitor' });
  }
};

/**
 * Resume a monitor
 */
export const resumeMonitor = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Monitor);
    const userId = (req as any).user?.id as number;
    const monitor = await repo.findOne({ where: { id: req.params.id, user_id: userId } });
    
    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    monitor.is_paused = false;
    await repo.save(monitor);
    
    sseManager.broadcastMonitors(userId);
    
    res.json({ message: 'Monitor resumed successfully', monitor });
  } catch (error: any) {
    console.error('Error resuming monitor:', error);
    res.status(500).json({ error: error.message || 'Failed to resume monitor' });
  }
};

/**
 * Get monitor response time history
 */
export const getResponseHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { range } = req.query as any;
    const logRepo = AppDataSource.getRepository(CheckLog);
    const repo = AppDataSource.getRepository(Monitor);
    const userId = (req as any).user?.id as number;
    
    // Ensure the monitor belongs to this user
    const owned = await repo.exists({ where: { id, user_id: userId } });
    if (!owned) {
      return res.status(404).json({ error: 'Monitor not found' });
    }
    
    const qb = logRepo
      .createQueryBuilder('log')
      .where('log.monitor_id = :id', { id })
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
    
    const history = logs.map(log => ({
      timestamp: log.timestamp,
      responseTime: log.response_time_ms,
      status: log.status
    }));
    
    res.json({ history });
  } catch (error: any) {
    console.error('Error fetching response history:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch response history' });
  }
};

/**
 * Send manual notification
 */
export const sendManualNotification = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Monitor);
    const userId = (req as any).user?.id as number;
    const monitor = await repo.findOne({ where: { id: req.params.id, user_id: userId } });
    
    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    const { message } = req.body;
    
    // Send notification with custom message
    await sendNotification(monitor, 'down', message || 'Manual notification');
    
    res.json({ message: 'Notification sent successfully' });
  } catch (error: any) {
    console.error('Error sending manual notification:', error);
    res.status(500).json({ error: error.message || 'Failed to send notification' });
  }
};
