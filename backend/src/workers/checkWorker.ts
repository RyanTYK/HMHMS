import * as dotenv from 'dotenv';

// Load environment variables FIRST before importing any modules that use them
dotenv.config();

import { AppDataSource } from '../utils/data-source';
import { sseManager } from '../utils/sseManager';
import { Monitor } from '../models/Monitor';
import { runCheck } from '../services/checkEngine';
import { cleanOldLogs } from '../controllers/monitorController';
import { LockManager } from '../utils/lockManager';
import { Brackets } from 'typeorm';

const MAX_CONCURRENT_CHECKS = parseInt(process.env.MAX_CONCURRENT_CHECKS || '40');
// How often to poll the DB for due monitors. It's okay to poll more slowly
// because each monitor has its own interval (in seconds) and we persist
// last_check after running a monitor. Configurable via environment variable.
const CHECK_INTERVAL_MS = parseInt(process.env.CHECK_INTERVAL_MS || '5000');

// Configurable retention period for logs (in days)
const LOG_RETENTION_DAYS = parseInt(process.env.LOG_RETENTION_DAYS || '7');

// Lock refresh interval (refresh every 10 seconds to prevent stale detection)
const LOCK_REFRESH_INTERVAL_MS = 10000;

const checkingNow = new Set<string>(); // Tracks monitors currently being checked

async function workerLoop() {
  // Resilient single-instance guard using PID-based lock with stale lock recovery
  const lockManager = new LockManager('worker.lock', 30000); // 30s stale timeout
  
  if (!(await lockManager.acquireLock())) {
    const lockInfo = lockManager.getLockInfo();
    console.error(`Another worker instance is running (PID: ${lockInfo?.pid}). Exiting.`);
    process.exit(1);
  }
  await AppDataSource.initialize();
  console.log(`Worker started with concurrent check logic (poll interval: ${CHECK_INTERVAL_MS}ms, max concurrent: ${MAX_CONCURRENT_CHECKS})`);
  const repo = AppDataSource.getRepository(Monitor);
  let lastCleanup = Date.now();
  let lastLockRefresh = Date.now();

  // Warn early if the configured concurrency cannot keep up with the workload.
  // A down monitor occupies a slot for roughly half its interval (retry budget),
  // so sustainable throughput is ~ MAX_CONCURRENT_CHECKS monitors per half-interval.
  try {
    const activeCount = await repo.count({ where: { active: true, is_paused: false } });
    if (activeCount > MAX_CONCURRENT_CHECKS * 2) {
      console.warn(
        `[Worker] ${activeCount} active monitors but MAX_CONCURRENT_CHECKS=${MAX_CONCURRENT_CHECKS}. ` +
        `If many are down, checks will fall behind their configured intervals. ` +
        `Consider raising MAX_CONCURRENT_CHECKS in .env.`
      );
    }
  } catch (err: any) {
    console.error('[Worker] Could not evaluate monitor capacity:', err?.message || err);
  }

  setInterval(async () => {
    const now = Date.now();

    // 0. Refresh lock periodically to prevent stale detection
    if (now - lastLockRefresh > LOCK_REFRESH_INTERVAL_MS) {
      if (!lockManager.refreshLock()) {
        console.error('Failed to refresh lock - another process may have taken over. Exiting.');
        process.exit(1);
      }
      lastLockRefresh = now;
    }

    // 1. Clean old logs periodically (e.g., every hour)
    if (now - lastCleanup > 3600000) {
      try {
        await cleanOldLogs();
        lastCleanup = now;
      } catch (error) {
        console.error('Log cleanup failed:', error);
      }
    }

    // 2. Check if we have capacity to run more checks
    if (checkingNow.size >= MAX_CONCURRENT_CHECKS) {
      return; // Wait for the next interval if we're at capacity
    }

    // 3. Find monitors that are due for a check.
    // We need to carefully group the conditions so that the OR for NULL last_check
    // doesn't bypass the active/exclusion filters. The approach below:
    // - Only consider active monitors that are NOT paused
    // - Exclude monitors that are currently being checked
    // - Select monitors where either last_check is NULL (never checked) OR
    //   the elapsed seconds since last_check >= interval_seconds
    const qb = repo.createQueryBuilder('monitor')
      .where('monitor.active = :active', { active: true })
      .andWhere('monitor.is_paused = :paused', { paused: false });

    // Exclude in-flight checks
    if (checkingNow.size > 0) {
      qb.andWhere('monitor.id NOT IN (:...ids)', { ids: [...checkingNow] });
    }

    // Group the last_check conditions so the OR doesn't bypass other filters.
    // Use TypeORM Brackets to build: (monitor.last_check IS NULL OR TIMESTAMPDIFF(...) >= monitor.interval_seconds)
    qb.andWhere(new Brackets((q: any) => {
      q.where('monitor.last_check IS NULL')
       .orWhere('TIMESTAMPDIFF(SECOND, monitor.last_check, NOW()) >= monitor.interval_seconds');
    }));

    const dueMonitors = await qb
      .take(MAX_CONCURRENT_CHECKS - checkingNow.size)
      .getMany();

    if (dueMonitors.length === 0) {
      return; // No work to do
    }

    console.log(`[Worker] Found ${dueMonitors.length} due monitors. In-flight checks: ${checkingNow.size}/${MAX_CONCURRENT_CHECKS}`);
    if (process.env.WORKER_DEBUG === 'true') {
      for (const m of dueMonitors) {
        console.log(`[Worker][DEBUG] Selected monitor id=${m.id} name="${m.name}" interval_seconds=${m.interval_seconds} last_check=${m.last_check}`);
      }
    }

    // 4. Trigger checks in parallel
    for (const monitor of dueMonitors) {
      try {
        // Attempt to atomically claim the monitor by updating last_check only if
        // it is NULL or the interval has passed. This prevents multiple worker
        // processes from running the same monitor concurrently or repeatedly.
        const updateResult = await repo.createQueryBuilder()
          .update()
          .set({ last_check: () => 'NOW()' })
          .where('id = :id', { id: monitor.id })
          .andWhere('(last_check IS NULL OR TIMESTAMPDIFF(SECOND, last_check, NOW()) >= interval_seconds)')
          .execute();

        if (!updateResult || updateResult.affected === 0) {
          console.log(`[Worker] Skipping monitor ${monitor.id} (${monitor.name}) - already claimed or not due`);
          continue;
        }

        // We claimed the monitor; add to in-flight set and run the check
        checkingNow.add(monitor.id);
        runCheck(monitor)
          .catch(err => {
            console.error(`[Worker] Unhandled error during check for ${monitor.name}:`, err?.message || err);
          })
          .finally(() => {
            // When the check is done, remove it from the in-progress set
            checkingNow.delete(monitor.id);
          });
      } catch (err: any) {
        console.error(`[Worker] Failed to claim/run monitor ${monitor.id}:`, err?.message || err);
      }
    }
  }, CHECK_INTERVAL_MS);
}

workerLoop();
