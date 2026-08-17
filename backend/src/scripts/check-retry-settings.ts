import { AppDataSource } from '../utils/data-source';
import { Monitor } from '../models/Monitor';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkRetrySettings() {
  console.log('Checking retry settings for monitors...\n');

  try {
    await AppDataSource.initialize();
    
    const monitorRepo = AppDataSource.getRepository(Monitor);
    const monitors = await monitorRepo.find({ take: 10 });

    if (monitors.length === 0) {
      console.log('No monitors found.');
      await AppDataSource.destroy();
      return;
    }

    console.log('Monitor Retry Settings:');
    console.log('='.repeat(100));
    
    monitors.forEach(monitor => {
      console.log(`\n📊 ${monitor.name} (${monitor.id})`);
      console.log(`   Type: ${monitor.type} | Target: ${monitor.target}`);
      console.log(`   Active: ${monitor.active} | Paused: ${monitor.is_paused}`);
      console.log(`   ⚙️  max_retries: ${monitor.max_retries} (will try ${monitor.max_retries + 1} times total)`);
      console.log(`   ⏱️  retry_interval: ${monitor.retry_interval} seconds (wait between retries)`);
      console.log(`   📧 notification_resend_after: ${monitor.notification_resend_after} hours (reminder interval)`);
      console.log(`   📬 notify_owner: ${monitor.notify_owner}`);
      
      // Calculate total time before marking as down
      const totalRetryTime = monitor.max_retries * monitor.retry_interval;
      if (monitor.max_retries > 0) {
        console.log(`   ⏳ Time before DOWN notification: ~${totalRetryTime} seconds (${Math.round(totalRetryTime / 60)} minutes)`);
      } else {
        console.log(`   ⚡ Time before DOWN notification: Instant (no retries)`);
      }
    });

    console.log('\n' + '='.repeat(100));
    console.log('\n💡 To update retry settings for a monitor, run:');
    console.log('   UPDATE monitors SET max_retries=5, retry_interval=60 WHERE id="monitor-id";');
    
    await AppDataSource.destroy();
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkRetrySettings();
