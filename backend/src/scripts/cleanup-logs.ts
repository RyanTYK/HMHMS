#!/usr/bin/env ts-node

/**
 * One-time cleanup script to remove old log entries from the database.
 * This script can be run manually or via the npm script "npm run cleanup"
 * 
 * Usage:
 *   ts-node src/scripts/cleanup-logs.ts [days]
 *   npm run cleanup
 * 
 * Environment Variables:
 *   LOG_RETENTION_DAYS - Number of days to retain logs (default: 7)
 *   CLEANUP_BATCH_SIZE - Number of records to delete per batch (default: 1000)
 */

import { AppDataSource } from '../utils/data-source';
import { CheckLog } from '../models/CheckLog';
import { LessThan } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface CleanupStats {
  totalDeleted: number;
  batches: number;
  durationMs: number;
  oldestDate: Date;
}

async function cleanupOldLogs(retentionDays?: number): Promise<CleanupStats> {
  const days = retentionDays || parseInt(process.env.LOG_RETENTION_DAYS || '7');
  const batchSize = parseInt(process.env.CLEANUP_BATCH_SIZE || '1000');
  
  console.log(`🧹 Starting cleanup of logs older than ${days} days...`);
  console.log(`📦 Batch size: ${batchSize} records`);
  
  const startTime = Date.now();
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  console.log(`📅 Cutoff date: ${cutoffDate.toISOString()}`);
  
  const logRepo = AppDataSource.getRepository(CheckLog);
  
  // First, get count of records to be deleted for progress tracking
  const totalToDelete = await logRepo.count({
    where: { timestamp: LessThan(cutoffDate) }
  });
  
  if (totalToDelete === 0) {
    console.log('✅ No old logs found to clean up.');
    return {
      totalDeleted: 0,
      batches: 0,
      durationMs: Date.now() - startTime,
      oldestDate: cutoffDate
    };
  }
  
  console.log(`📊 Found ${totalToDelete} logs to delete`);
  
  let totalDeleted = 0;
  let batchCount = 0;
  
  // Delete in batches to avoid long-running transactions
  while (true) {
    // First, find a batch of IDs to delete
    const idsToDelete = await logRepo
      .createQueryBuilder('log')
      .select('log.id')
      .where('log.timestamp < :cutoffDate', { cutoffDate })
      .limit(batchSize)
      .getMany();
    
    if (idsToDelete.length === 0) {
      break; // No more records to delete
    }
    
    // Delete the batch by IDs
    const result = await logRepo
      .createQueryBuilder()
      .delete()
      .from(CheckLog)
      .whereInIds(idsToDelete.map(log => log.id))
      .execute();
    
    const deletedInBatch = result.affected || 0;
    totalDeleted += deletedInBatch;
    batchCount++;
    
    const progress = ((totalDeleted / totalToDelete) * 100).toFixed(1);
    console.log(`⏳ Batch ${batchCount}: Deleted ${deletedInBatch} records (${totalDeleted}/${totalToDelete} - ${progress}%)`);
    
    // Small delay to prevent overwhelming the database
    if (idsToDelete.length === batchSize) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const durationMs = Date.now() - startTime;
  const stats: CleanupStats = {
    totalDeleted,
    batches: batchCount,
    durationMs,
    oldestDate: cutoffDate
  };
  
  console.log(`✅ Cleanup completed!`);
  console.log(`📊 Total deleted: ${totalDeleted} records`);
  console.log(`⏱️  Duration: ${(durationMs / 1000).toFixed(2)} seconds`);
  console.log(`📦 Batches processed: ${batchCount}`);
  
  return stats;
}

async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const retentionDays = args[0] ? parseInt(args[0]) : undefined;
    
    if (retentionDays && (isNaN(retentionDays) || retentionDays < 1)) {
      console.error('❌ Invalid retention days. Must be a positive number.');
      process.exit(1);
    }
    
    // Initialize database connection
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');
    
    // Run cleanup
    const stats = await cleanupOldLogs(retentionDays);
    
    // Close database connection
    await AppDataSource.destroy();
    console.log('🔌 Database connection closed');
    
    // Exit with appropriate code
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    
    // Ensure database connection is closed on error
    try {
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
      }
    } catch (closeError) {
      console.error('❌ Error closing database connection:', closeError);
    }
    
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main();
}

export { cleanupOldLogs };