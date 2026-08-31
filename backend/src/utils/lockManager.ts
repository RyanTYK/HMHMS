import fs from 'fs';
import path from 'path';

export interface LockInfo {
  pid: number;
  timestamp: number;
  hostname?: string;
  startTime?: number;
}

export class LockManager {
  private lockPath: string;
  private maxStaleTime: number;
  private handlersRegistered = false;

  constructor(lockFileName: string = 'worker.lock', maxStaleTimeMs: number = 30000) {
    this.lockPath = path.join(__dirname, '..', '..', lockFileName);
    this.maxStaleTime = maxStaleTimeMs;
  }

  /**
   * Attempts to acquire an exclusive lock with PID-based stale lock detection
   * @returns true if lock acquired, false if another process holds the lock
   */
  async acquireLock(attempt: number = 0): Promise<boolean> {
    try {
      // First, check if lock file exists and if it's stale
      if (fs.existsSync(this.lockPath)) {
        const lockInfo = this.readLockFile();
        if (lockInfo && this.isLockStale(lockInfo)) {
          console.log(`[LockManager] Found stale lock (PID: ${lockInfo.pid}), reclaiming...`);
          this.releaseLock(); // Remove stale lock
        } else if (lockInfo) {
          console.log(`[LockManager] Active lock held by PID: ${lockInfo.pid}`);
          return false; // Active lock exists
        }
      }

      // Attempt to create lock file atomically
      const lockInfo: LockInfo = {
        pid: process.pid,
        timestamp: Date.now(),
        hostname: require('os').hostname(),
        startTime: this.getProcessStartTime(process.pid) ?? undefined,
      };

      // Use 'wx' flag to create file exclusively (fails if exists)
      const fd = fs.openSync(this.lockPath, 'wx');
      fs.writeSync(fd, JSON.stringify(lockInfo, null, 2));
      fs.closeSync(fd);

      console.log(`[LockManager] Lock acquired by PID: ${process.pid}`);
      this.setupCleanupHandlers();
      return true;

    } catch (err: any) {
      if (err.code === 'EEXIST') {
        // File was created between our check and creation attempt
        const lockInfo = this.readLockFile();
        if (lockInfo && this.isLockStale(lockInfo) && attempt < 3) {
          // Bounded retry so competing processes cannot recurse indefinitely
          console.log(`[LockManager] Lock file created concurrently, retrying (attempt ${attempt + 1})...`);
          this.releaseLock();
          return this.acquireLock(attempt + 1);
        }
        return false;
      }
      console.error('[LockManager] Error acquiring lock:', err.message);
      return false;
    }
  }

  /**
   * Reads and parses lock file contents
   */
  private readLockFile(): LockInfo | null {
    try {
      const content = fs.readFileSync(this.lockPath, 'utf8');
      return JSON.parse(content) as LockInfo;
    } catch (err) {
      console.warn('[LockManager] Failed to read lock file:', err);
      return null;
    }
  }

  /**
   * Checks if a lock is stale by verifying if the PID is still running
   * and if the lock age exceeds the maximum stale time
   */
  private isLockStale(lockInfo: LockInfo): boolean {
    // A lock is only stale if the owning process is genuinely gone.
    // Age alone is NOT sufficient: a busy-but-alive worker would otherwise have
    // its lock stolen, allowing two workers to run checks simultaneously.
    //
    // A plain "is this PID alive" check is unsound inside a container: a
    // container's PID namespace resets on every restart, so a freshly
    // restarted worker is *always* PID 1 again - identical to whatever PID
    // a previous, ungracefully-killed (SIGKILL, e.g. a host/Docker Desktop
    // restart) instance left behind in the lock file. That process is dead,
    // but "PID 1 is alive" is trivially true from the new process's own
    // perspective, so the lock looks permanently active and the worker
    // crash-loops forever. Comparing the recorded process start time (from
    // /proc/<pid>/stat) against the current holder of that PID catches this:
    // a mismatch proves it's a different process even though the PID matches.
    if (lockInfo.startTime !== undefined) {
      const currentStartTime = this.getProcessStartTime(lockInfo.pid);
      if (currentStartTime === null) {
        console.log(`[LockManager] Process PID ${lockInfo.pid} no longer exists`);
        return true;
      }
      if (currentStartTime !== lockInfo.startTime) {
        console.log(`[LockManager] PID ${lockInfo.pid} was reused by a different process (start time mismatch) - stale lock`);
        return true;
      }
    } else if (!this.isProcessAlive(lockInfo.pid)) {
      // Lock file predates the startTime field - fall back to the old check.
      console.log(`[LockManager] Process PID ${lockInfo.pid} no longer exists`);
      return true;
    }

    const lockAge = Date.now() - lockInfo.timestamp;
    if (lockAge > this.maxStaleTime) {
      // The process is alive but hasn't refreshed. It may be a recycled PID, so
      // warn loudly rather than silently stealing the lock from a live worker.
      console.warn(
        `[LockManager] Lock is ${lockAge}ms old (max ${this.maxStaleTime}ms) but PID ${lockInfo.pid} ` +
        `is still alive - treating as ACTIVE. Delete the lock file manually if this is wrong.`
      );
    }
    return false;
  }

  /**
   * Reads a process's start time (in clock ticks since boot) from
   * /proc/<pid>/stat, for detecting PID reuse. Returns null if unavailable
   * (non-Linux, or no process currently holds that PID).
   */
  private getProcessStartTime(pid: number): number | null {
    try {
      const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
      // Field 2 (comm, the executable name) is parenthesized and may itself
      // contain spaces or parens, so skip past the *last* ')' before doing a
      // plain space-split on the fixed-format fields that follow.
      const afterComm = stat.slice(stat.lastIndexOf(')') + 2);
      const fields = afterComm.split(' ');
      // starttime is field 22 overall; fields[0] here is field 3 (state), so index 19.
      const startTime = parseInt(fields[19], 10);
      return Number.isNaN(startTime) ? null : startTime;
    } catch {
      return null;
    }
  }

  /**
   * Returns true if a process with the given pid currently exists.
   */
  private isProcessAlive(pid: number): boolean {
    if (!pid || pid <= 0) return false;
    try {
      // Signal 0 checks existence without actually signalling.
      process.kill(pid, 0);
      return true;
    } catch (err: any) {
      if (err.code === 'ESRCH') return false;
      // EPERM means it exists but is owned by another user.
      if (err.code === 'EPERM') return true;
      console.warn(`[LockManager] Error checking process ${pid}:`, err.message);
      return true; // Err on the side of not stealing the lock
    }
  }

  /**
   * Releases the lock by removing the lock file
   */
  releaseLock(): void {
    try {
      if (fs.existsSync(this.lockPath)) {
        fs.unlinkSync(this.lockPath);
        console.log(`[LockManager] Lock released by PID: ${process.pid}`);
      }
    } catch (err) {
      console.error('[LockManager] Error releasing lock:', err);
    }
  }

  /**
   * Sets up cleanup handlers to ensure lock is released on process exit
   */
  private setupCleanupHandlers(): void {
    if (this.handlersRegistered) return;
    this.handlersRegistered = true;

    const cleanupAndExit = (code: number) => {
      this.releaseLock();
      process.exit(code);
    };

    process.on('SIGINT', () => cleanupAndExit(0));
    process.on('SIGTERM', () => cleanupAndExit(0));

    // On 'exit' we may only do synchronous work, and must NOT call process.exit()
    // again - doing so would overwrite the real exit code (e.g. turning a
    // failure exit(1) into a success exit(0)).
    process.on('exit', () => {
      this.releaseLock();
    });

    process.on('uncaughtException', (err) => {
      console.error('[LockManager] Uncaught exception:', err);
      cleanupAndExit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('[LockManager] Unhandled rejection at:', promise, 'reason:', reason);
      cleanupAndExit(1);
    });
  }

  /**
   * Periodically refreshes the lock timestamp to prevent it from becoming stale
   * Call this in your main loop if you want to prevent stale lock reclamation
   */
  refreshLock(): boolean {
    try {
      if (fs.existsSync(this.lockPath)) {
        const lockInfo = this.readLockFile();
        if (lockInfo && lockInfo.pid === process.pid) {
          lockInfo.timestamp = Date.now();
          fs.writeFileSync(this.lockPath, JSON.stringify(lockInfo, null, 2));
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('[LockManager] Error refreshing lock:', err);
      return false;
    }
  }

  /**
   * Gets information about the current lock holder
   */
  getLockInfo(): LockInfo | null {
    if (!fs.existsSync(this.lockPath)) {
      return null;
    }
    return this.readLockFile();
  }
}