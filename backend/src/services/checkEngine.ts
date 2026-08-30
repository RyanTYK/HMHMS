import { AppDataSource } from '../utils/data-source';
import dotenv from 'dotenv';
dotenv.config();
import { Monitor } from '../models/Monitor';
import { CheckLog } from '../models/CheckLog';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { MonitorDependency } from '../models/MonitorDependency';
import { notificationService } from './notificationService';
import { transporter } from './emailService';
import { escapeHtml } from '../utils/htmlEscape';
import axios from 'axios';
import net from 'net';
import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import { sseManager } from '../utils/sseManager';
import { debugLog } from '../utils/debugLog';

// The shared SMTP verify/transporter live in emailService.ts; re-exported
// here since callers already import verifySMTPTransport from this module.
export { verifySMTPTransport } from './emailService';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

/**
 * Monitor targets are user-supplied and are passed to system commands.
 * Only allow hostnames, IPv4/IPv6 literals and UNC paths so that shell
 * metacharacters can never reach a command line.
 */
const HOSTNAME_RE = /^[A-Za-z0-9._-]+$/;
const IPV6_RE = /^[0-9A-Fa-f:.]+$/;
const UNC_RE = /^\\\\[A-Za-z0-9._-]+(\\[^\\/:*?"<>|]+)+\\?$/;

function isSafeHost(target: string): boolean {
  if (!target || target.length > 255) return false;
  return HOSTNAME_RE.test(target) || IPV6_RE.test(target);
}

function isSafeUncPath(target: string): boolean {
  if (!target || target.length > 255) return false;
  return UNC_RE.test(target);
}

async function checkVPNDependency(dependency?: string): Promise<boolean> {
  if (!dependency) return true;

  try {
    const isWindows = process.platform === 'win32';

    if (isWindows && dependency.includes('VPN')) {
      // Static script with no interpolation of user input.
      const script = 'Get-VpnConnection | Where-Object { $_.ConnectionStatus -eq "Connected" } | ConvertTo-Json -Compress';
      const { stdout } = await execFileAsync(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-Command', script],
        { timeout: 15000 }
      );

      const trimmed = (stdout || '').trim();
      if (!trimmed) return false; // No connected VPN
      const connections = JSON.parse(trimmed);
      return Array.isArray(connections) ? connections.length > 0 : !!connections;
    }

    return true; // Skip dependency check on non-Windows or non-VPN dependencies
  } catch (error) {
    // A failure to *evaluate* the dependency must not silently skip monitoring.
    // Treat it as "dependency satisfied" so the real check still runs and can alert.
    console.error('VPN dependency check errored, proceeding with check:', error);
    return true;
  }
}

async function performSMBCheck(target: string, timeout: number): Promise<{ status: 'up' | 'down', response_time_ms?: number, error_text?: string }> {
  try {
    const isWindows = process.platform === 'win32';

    if (isWindows) {
      if (!isSafeUncPath(target)) {
        return { status: 'down', error_text: `Invalid SMB path: ${target}` };
      }

      const startTime = Date.now();
      try {
        // cmd.exe /c dir with the path as a separate argv entry (no shell string building)
        await execFileAsync('cmd.exe', ['/c', 'dir', target, '/A'], { timeout });
        return {
          status: 'up',
          response_time_ms: Date.now() - startTime
        };
      } catch (error: any) {
        return {
          status: 'down',
          error_text: `SMB share not accessible: ${error?.message || error}`
        };
      }
    } else {
      // For Linux/Mac, try to ping the host at least
      const host = target.split('\\')[2] || target;
      return await performPingCheck(host, timeout);
    }
  } catch (error) {
    return {
      status: 'down',
      error_text: `SMB check failed: ${error}`
    };
  }
}

async function performPingCheck(target: string, timeout: number): Promise<{ status: 'up' | 'down', response_time_ms?: number, error_text?: string }> {
  if (!isSafeHost(target)) {
    return { status: 'down', error_text: `Invalid ping target: ${target}` };
  }

  const isWindows = process.platform === 'win32';
  // Windows: -n <count> -w <ms>. Unix: -c <count> -W <seconds>
  const args = isWindows
    ? ['-n', '1', '-w', String(timeout), target]
    : ['-c', '1', '-W', String(Math.max(1, Math.ceil(timeout / 1000))), target];

  const start = Date.now();
  try {
    const { stdout } = await execFileAsync('ping', args, { timeout: timeout + 5000 });
    // Windows prints "TTL=" on success; Unix prints "ttl=".
    if (/ttl=/i.test(stdout)) {
      return { status: 'up', response_time_ms: Date.now() - start };
    }
    return { status: 'down', error_text: 'No response' };
  } catch (err: any) {
    return { status: 'down', error_text: err?.message || 'Ping failed' };
  }
}

async function performSingleCheck(monitor: Monitor): Promise<{
  status: 'up' | 'down';
  response_time_ms?: number;
  http_status?: number;
  error_text?: string;
}> {
  let status: 'up' | 'down' = 'down';
  let response_time_ms: number | undefined;
  let http_status: number | undefined;
  let error_text: string | undefined;
  const start = Date.now();

  try {
    if (monitor.type === 'http') {
      // Without validateStatus, axios treats any 4xx/5xx as a rejected promise
      // and this whole branch falls into the catch block below - http_status
      // never gets set and error_text becomes a generic axios message instead
      // of the real response status. Accept every status here and classify it
      // ourselves so a real HTTP error is reported accurately.
      const res = await axios.get(monitor.target, { timeout: monitor.timeout_ms, validateStatus: () => true });
      status = res.status < 400 ? 'up' : 'down';
      http_status = res.status;
      response_time_ms = Date.now() - start;
      if (status === 'down') {
        error_text = `HTTP ${res.status} ${res.statusText || ''}`.trim();
      }
    } else if (monitor.type === 'tcp') {
      if (!monitor.port || monitor.port < 1 || monitor.port > 65535) {
        throw new Error('TCP monitor requires a valid port (1-65535)');
      }
      await new Promise((resolve, reject) => {
        const socket = net.createConnection(monitor.port!, monitor.target, () => {
          status = 'up';
          response_time_ms = Date.now() - start;
          socket.end();
          resolve(true);
        });
        socket.on('error', err => {
          socket.destroy();
          error_text = err.message;
          reject(err);
        });
        socket.setTimeout(monitor.timeout_ms, () => {
          error_text = 'Timeout';
          socket.destroy();
          reject(new Error('Timeout'));
        });
      });
    } else if (monitor.type === 'ping') {
      const result = await performPingCheck(monitor.target, monitor.timeout_ms);
      status = result.status;
      response_time_ms = result.response_time_ms;
      error_text = result.error_text;
    } else if (monitor.type === 'smb') {
      const result = await performSMBCheck(monitor.target, monitor.timeout_ms);
      status = result.status;
      response_time_ms = result.response_time_ms;
      error_text = result.error_text;
    }
  } catch (err: any) {
    error_text = err?.message || 'Unknown error';
  }

  return { status, response_time_ms, http_status, error_text };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Upper bound (in seconds) on how long a single runCheck may spend sleeping
 * between retries. Retries exist to confirm a failure, but while they run the
 * monitor occupies a worker concurrency slot. Without a bound, a monitor
 * configured with retry_interval=60 and max_retries=3 blocks a slot for over
 * three minutes, which starves every other monitor.
 *
 * The budget defaults to half the monitor's own interval so that even a
 * permanently-down monitor is re-checked at roughly the period it is
 * configured for.
 */
function getRetryBudgetMs(monitor: Monitor): number {
  const configured = Number(process.env.MAX_RETRY_BUDGET_SECONDS);
  if (Number.isFinite(configured) && configured > 0) return configured * 1000;
  const interval = monitor.interval_seconds > 0 ? monitor.interval_seconds : 60;
  return Math.max(5, Math.floor(interval / 2)) * 1000;
}

export async function runCheck(monitor: Monitor) {
  debugLog(`[CheckEngine] Starting check for ${monitor.id} (${monitor.name}) at ${new Date().toISOString()}`);
  
  // Check monitor dependencies (other monitors must be UP)
  const dependencyRepo = AppDataSource.getRepository(MonitorDependency);
  const dependencies = await dependencyRepo.find({
    where: { monitor_id: monitor.id },
    relations: ['dependsOnMonitor']
  });

  for (const dep of dependencies) {
    if (dep.dependsOnMonitor && dep.dependsOnMonitor.last_status !== 'up') {
      debugLog(`Skipping check for ${monitor.name} - dependency ${dep.dependsOnMonitor.name} is not UP`);
      return;
    }
  }

  const dependencyMet = await checkVPNDependency(monitor.dependency);
  if (!dependencyMet) {
    debugLog(`Skipping check for ${monitor.name} - VPN dependency not met`);
    return;
  }

  let checkResult = await performSingleCheck(monitor);
  let attemptCount = 1;

  if (checkResult.status === 'down' && monitor.max_retries > 0) {
    debugLog(`[CheckEngine] ${monitor.name} failed (attempt ${attemptCount}/${monitor.max_retries + 1}). Retrying...`);

    let retryBudgetMs = getRetryBudgetMs(monitor);
    let clampWarned = false;

    for (let retry = 0; retry < monitor.max_retries; retry++) {
      if (retryBudgetMs <= 0) {
        console.warn(
          `[CheckEngine] ${monitor.name}: retry budget exhausted after ${attemptCount} attempt(s); ` +
          `skipping remaining ${monitor.max_retries - retry} retr(ies) to avoid starving other monitors.`
        );
        break;
      }

      // Never sleep longer than the remaining budget for this check.
      const configuredDelayMs = Math.max(0, (monitor.retry_interval || 0) * 1000);
      const delayMs = Math.min(configuredDelayMs, retryBudgetMs);
      if (delayMs < configuredDelayMs && !clampWarned) {
        clampWarned = true;
        console.warn(
          `[CheckEngine] ${monitor.name}: retry_interval of ${monitor.retry_interval}s clamped to ` +
          `${Math.round(delayMs / 1000)}s to stay within this monitor's retry budget.`
        );
      }

      const waitStart = Date.now();
      await sleep(delayMs);
      retryBudgetMs -= Date.now() - waitStart;

      attemptCount++;
      debugLog(`[CheckEngine] Retry ${retry + 1}/${monitor.max_retries} for ${monitor.name} (attempt ${attemptCount}/${monitor.max_retries + 1})`);

      const probeStart = Date.now();
      checkResult = await performSingleCheck(monitor);
      retryBudgetMs -= Date.now() - probeStart;

      if (checkResult.status === 'up') {
        debugLog(`[CheckEngine] ${monitor.name} recovered on retry ${retry + 1}`);
        break;
      }
    }
  }

  const { status, response_time_ms, http_status, error_text } = checkResult;
  
  if (attemptCount > 1) {
    debugLog(`[CheckEngine] Final status for ${monitor.name} after ${attemptCount} attempts: ${status}`);
  }

  // Determine previous status BEFORE writing the new log so we can detect changes accurately
  const logRepo = AppDataSource.getRepository(CheckLog);
  const prevLog = await logRepo.findOne({
    where: { monitor_id: monitor.id },
    order: { timestamp: 'DESC' }
  });

  const log = logRepo.create({
    monitor_id: monitor.id,
    timestamp: new Date(),
    status,
    response_time_ms,
    http_status,
    error_text
  });
  await logRepo.save(log);

  debugLog(`[CheckEngine] Saved log for ${monitor.id} at ${log.timestamp.toISOString()} status=${status}`);

  // Calculate uptime percentage (last 100 checks)
  const recentLogs = await logRepo.find({
    where: { monitor_id: monitor.id },
    order: { timestamp: 'DESC' },
    take: 100
  });
  
  const upCount = recentLogs.filter(l => l.status === 'up').length;
  const uptimePercentage = recentLogs.length > 0 
    ? parseFloat(((upCount / recentLogs.length) * 100).toFixed(2))
    : 100.0;

  // Update monitor with new status, response time, uptime, and last_check
  // Use query builder to update only check-related fields, avoiding race conditions
  // where user edits are overwritten by the worker saving the old monitor object
  try {
    const monitorRepo = AppDataSource.getRepository(Monitor);
    await monitorRepo
      .createQueryBuilder()
      .update(Monitor)
      .set({
        last_check: new Date(),
        last_status: status,
        last_response_time: response_time_ms || undefined,
        uptime_percentage: uptimePercentage
      })
      .where('id = :id', { id: monitor.id })
      .execute();
    debugLog(`[CheckEngine] Updated monitor ${monitor.id}: status=${status}, uptime=${uptimePercentage}%`);
  } catch (err: any) {
    console.error(`Failed to update monitor ${monitor.id}:`, err?.message || err);
  }

  // Proactively broadcast check completion and monitor updates to owner
  if ((monitor as any).user_id) {
    const uid = (monitor as any).user_id as number;
    sseManager.broadcastCheckComplete(uid, monitor.id);
    setTimeout(() => sseManager.broadcastMonitors(uid), 150);
  }

  // Notification logic - Always check for status changes to create in-app notifications
  const notificationRepo = AppDataSource.getRepository(Notification);
  const statusChanged = prevLog && prevLog.status !== status;

  let shouldNotify = false;
  let notificationReason = '';

  debugLog(`[CheckEngine] Notification check for ${monitor.name}: status=${status}, statusChanged=${statusChanged}, prevStatus=${prevLog?.status}, notify_owner=${monitor.notify_owner}`);

  if (statusChanged) {
    // Status changed (up->down or down->up) - ALWAYS notify immediately
    shouldNotify = true;
    notificationReason = 'Status changed';
  } else if (status === 'down') {
    // Monitor is still down - check if we should send a reminder
    // Find the last notification sent for this monitor (of any type)
    const lastNotif = await notificationRepo.findOne({
      where: { monitor_id: monitor.id },
      order: { sent_at: 'DESC' }
    });

    debugLog(`[CheckEngine] Last notification for ${monitor.name}: ${lastNotif ? new Date(lastNotif.sent_at).toISOString() : 'none'}`);

    if (!lastNotif) {
      // No notification ever sent (this shouldn't happen, but just in case)
      shouldNotify = true;
      notificationReason = 'First notification';
    } else {
      // Check if enough time has passed for a reminder
      const timeSinceLastNotif = Date.now() - lastNotif.sent_at.getTime();
      const reminderInterval = monitor.notification_resend_after * 60 * 1000; // minutes to ms

      debugLog(`[CheckEngine] Time since last notification: ${Math.round(timeSinceLastNotif / 60000)} min, reminder interval: ${monitor.notification_resend_after} minutes`);

      if (timeSinceLastNotif >= reminderInterval) {
        shouldNotify = true;
        notificationReason = `Reminder (still down for ${Math.round(timeSinceLastNotif / 60000)} minutes)`;
      }
    }
  }

  if (shouldNotify) {
    debugLog(`[CheckEngine] Sending notification for ${monitor.name}: ${notificationReason}`);

    if (monitor.notify_alert) {
      await notificationService.createStatusNotification(
        monitor.user_id,
        monitor.id,
        monitor.name,
        status
      );
      debugLog(`[CheckEngine] Created in-app notification for ${monitor.name}`);
    } else {
      debugLog(`[CheckEngine] Skipping in-app notification (notify_alert is disabled)`);
    }

    // Send email notifications based on notify_owner and email_recipients settings
    const emailList: string[] = [];

    if (monitor.notify_owner) {
      const userRepo = AppDataSource.getRepository(User);
      const owner = await userRepo.findOne({ where: { id: monitor.user_id } });
      if (owner?.email) {
        emailList.push(owner.email);
        debugLog(`[CheckEngine] Added owner email to notification list`);
      }
    } else {
      debugLog(`[CheckEngine] Skipping owner email (notify_owner is disabled)`);
    }

    // Add additional recipients if configured (independent of notify_owner)
    if (monitor.email_recipients) {
      const additionalEmails = monitor.email_recipients
        .split(',')
        .map(email => email.trim())
        .filter(email => email);
      emailList.push(...additionalEmails);
      debugLog(`[CheckEngine] Added ${additionalEmails.length} additional email recipients`);
    }

    if (emailList.length > 0) {
      for (const email of emailList) {
        try {
          await sendNotification(monitor, status, email);
          debugLog(`Sent ${status} notification for ${monitor.name} to ${email}`);
        } catch (error: any) {
          console.error(`Failed to send notification to ${email}:`, error?.message || error);
        }
      }
    } else {
      debugLog(`[CheckEngine] No email recipients configured for ${monitor.name}`);
    }
  }
}

export async function sendNotification(monitor: Monitor, event_type: 'down' | 'up', email: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'hmhms@localhost',
    to: email,
    subject: `Monitor ${monitor.name} is ${event_type}`,
    text: `Monitor ${monitor.name} (${monitor.target}) is now ${event_type}.`,
    html: `
      <div style="font-family: Arial, sans-serif; border:1px solid #eee; padding:24px; max-width:600px; margin:auto;">
        <h2 style="color:#2d6cdf;">HMHMS Monitor Notification</h2>
        <p>Dear User,</p>
        <p>The following monitor has changed status:</p>
        <ul>
          <li><strong>Name:</strong> ${escapeHtml(monitor.name)}</li>
          <li><strong>Target:</strong> ${escapeHtml(monitor.target)}</li>
          <li><strong>Status:</strong> <span style="color:${event_type === 'down' ? '#d32f2f' : '#388e3c'}; font-weight:bold;">${event_type.toUpperCase()}</span></li>
          <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>Please check your dashboard for more details.</p>
        <hr style="margin:24px 0;">
        <footer style="font-size:12px; color:#888;">HMHMS Automated Notification &copy; ${new Date().getFullYear()}</footer>
      </div>
    `
  });
  const notifRepo = AppDataSource.getRepository(Notification);
  await notifRepo.save(notifRepo.create({
    monitor_id: monitor.id,
    event_type,
    sent_to: email,
    sent_at: new Date()
  }));
}

export async function sendTestNotificationEmail(monitor: Monitor, email: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'hmhms@localhost',
    to: email,
    subject: `[TEST] Monitor notification for ${monitor.name}`,
    text: `This is a test notification for monitor "${monitor.name}" (${monitor.target}).\n\nYou will receive alerts at this email address when the monitor status changes.\n\nThis is a test message - no action required.`,
    html: `
      <div style="font-family: Arial, sans-serif; border:1px solid #eee; padding:24px; max-width:600px; margin:auto;">
        <h2 style="color:#2d6cdf;">HMHMS Test Notification</h2>
        <p>This is a <strong>test notification</strong> for the following monitor:</p>
        <ul>
          <li><strong>Name:</strong> ${escapeHtml(monitor.name)}</li>
          <li><strong>Target:</strong> ${escapeHtml(monitor.target)}</li>
        </ul>
        <p>You will receive alerts at this email address when the monitor status changes.</p>
        <p style="color:#888;">This is a test message - no action required.</p>
        <hr style="margin:24px 0;">
        <footer style="font-size:12px; color:#888;">HMHMS Automated Notification &copy; ${new Date().getFullYear()}</footer>
      </div>
    `
  });
}

