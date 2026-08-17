#!/usr/bin/env ts-node

/**
 * Daily retention policy job to automatically clean up old log entries.
 * This script is designed to run as a scheduled job (cron, task scheduler, etc.)
 * 
 * Features:
 * - Runs continuously with configurable schedule
 * - Graceful shutdown handling
 * - Logging and error handling
 * - Resource management
 * 
 * Usage:
 *   ts-node src/scripts/retention-job.ts
 *   npm run retention-job
 * 
 * Environment Variables:
 *   LOG_RETENTION_DAYS - Number of days to retain logs (default: 7)
 *   RETENTION_SCHEDULE - Cron-style schedule (default: daily at 2 AM)
 *   CLEANUP_BATCH_SIZE - Batch size for deletions (default: 1000)
 */

import { AppDataSource } from '../utils/data-source';
import { cleanupOldLogs } from './cleanup-logs';
import { LockManager } from '../utils/lockManager';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class RetentionJobScheduler {
  private isRunning = false;
  private shouldStop = false;
  private lockManager: LockManager;
  private scheduleInterval: number;
  
  constructor() {
    this.lockManager = new LockManager('retention-job.lock', 60000); // 1 minute stale timeout
    
    // Parse schedule - default to daily at 2 AM (in milliseconds)
    const scheduleHours = parseInt(process.env.RETENTION_SCHEDULE_HOURS || '24');
    this.scheduleInterval = scheduleHours * 60 * 60 * 1000; // Convert to milliseconds
    
    this.setupSignalHandlers();
  }
  
  private setupSignalHandlers(): void {
    const gracefulShutdown = async (signal: string) => {
      console.log(`📢 Received ${signal}, initiating graceful shutdown...`);
      this.shouldStop = true;
      
      if (this.isRunning) {
        console.log('⏳ Waiting for current retention job to complete...');
        // Wait up to 30 seconds for current job to finish
        let waitTime = 0;
        while (this.isRunning && waitTime < 30000) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          waitTime += 1000;
        }
      }
      
      this.lockManager.releaseLock();
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    };
    
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  }
  
  private async runRetentionJob(): Promise<void> {
    if (this.isRunning || this.shouldStop) {
      return;
    }
    
    this.isRunning = true;
    console.log(`🗑️  Starting scheduled retention job at ${new Date().toISOString()}`);
    
    try {
      // Initialize database if not already done
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
        console.log('🔌 Database connection established');
      }
      
      // Run the cleanup
      const stats = await cleanupOldLogs();
      
      if (stats.totalDeleted > 0) {
        console.log(`✅ Retention job completed: ${stats.totalDeleted} records deleted in ${(stats.durationMs / 1000).toFixed(2)}s`);
      } else {
        console.log('✅ Retention job completed: No old records to clean up');
      }
      
    } catch (error) {
      console.error('❌ Retention job failed:', error);
    } finally {
      this.isRunning = false;
    }
  }
  
  private calculateNextRunTime(): Date {
    const now = new Date();
    const next = new Date(now.getTime() + this.scheduleInterval);
    
    // If we have a daily schedule, align to the specified hour
    if (this.scheduleInterval === 24 * 60 * 60 * 1000) {
      const targetHour = parseInt(process.env.RETENTION_JOB_HOUR || '2');
      next.setHours(targetHour, 0, 0, 0);
      
      // If the target time has already passed today, schedule for tomorrow
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
    }
    
    return next;
  }
  
  async start(): Promise<void> {
    // Acquire lock to ensure only one retention job instance runs
    if (!(await this.lockManager.acquireLock())) {
      const lockInfo = this.lockManager.getLockInfo();
      console.error(`❌ Another retention job instance is running (PID: ${lockInfo?.pid}). Exiting.`);
      process.exit(1);
    }
    
    console.log('🚀 Retention job scheduler started');
    console.log(`⏰ Schedule interval: ${this.scheduleInterval / (60 * 60 * 1000)} hours`);
    
    // Run immediately on startup if requested
    if (process.env.RUN_ON_STARTUP === 'true') {
      console.log('🔄 Running initial retention job...');
      await this.runRetentionJob();
    }
    
    // Schedule the main loop
    const mainLoop = async () => {
      while (!this.shouldStop) {
        const nextRun = this.calculateNextRunTime();
        const waitTime = nextRun.getTime() - Date.now();
        
        console.log(`⏰ Next retention job scheduled for: ${nextRun.toISOString()}`);
        
        // Wait until next scheduled time or until shutdown
        const sleepInterval = Math.min(waitTime, 60000); // Check every minute
        await new Promise(resolve => setTimeout(resolve, sleepInterval));
        
        if (this.shouldStop) {
          break;
        }
        
        // Check if it's time to run
        if (Date.now() >= nextRun.getTime() - 1000) { // 1 second tolerance
          await this.runRetentionJob();
          
          // Refresh lock after successful job
          this.lockManager.refreshLock();
        }
      }
    };
    
    await mainLoop();
  }
  
  async stop(): Promise<void> {
    this.shouldStop = true;
    this.lockManager.releaseLock();
    
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

async function main() {
  try {
    const scheduler = new RetentionJobScheduler();
    await scheduler.start();
  } catch (error) {
    console.error('❌ Retention job scheduler failed:', error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main();
}

export { RetentionJobScheduler };