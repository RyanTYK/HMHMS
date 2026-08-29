import { AppDataSource } from '../utils/data-source';
import { Monitor } from '../models/Monitor';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { verifySMTPTransport, sendTestNotificationEmail } from '../services/checkEngine';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

interface DiagnosticResult {
  category: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'INFO';
  message: string;
  details?: any;
}

const results: DiagnosticResult[] = [];

function addResult(category: string, status: DiagnosticResult['status'], message: string, details?: any) {
  results.push({ category, status, message, details });
}

function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('EMAIL NOTIFICATION DIAGNOSTIC REPORT');
  console.log('='.repeat(80) + '\n');

  const categories = [...new Set(results.map(r => r.category))];
  
  categories.forEach(category => {
    console.log(`\n📋 ${category}`);
    console.log('-'.repeat(80));
    
    results.filter(r => r.category === category).forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : 
                   result.status === 'FAIL' ? '❌' : 
                   result.status === 'WARNING' ? '⚠️' : 'ℹ️';
      
      console.log(`${icon} [${result.status}] ${result.message}`);
      
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    });
  });

  console.log('\n' + '='.repeat(80));
  
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const warnCount = results.filter(r => r.status === 'WARNING').length;
  
  if (failCount > 0) {
    console.log(`\n❌ ${failCount} CRITICAL ISSUE(S) FOUND`);
  }
  if (warnCount > 0) {
    console.log(`⚠️  ${warnCount} WARNING(S) FOUND`);
  }
  if (failCount === 0 && warnCount === 0) {
    console.log('\n✅ ALL CHECKS PASSED!');
  }
  
  console.log('='.repeat(80) + '\n');
}

async function diagnose() {
  console.log('🔍 Starting email notification diagnostic...\n');

  // 1. Check .env file
  console.log('Checking environment configuration...');
  const envPath = path.join(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    addResult('Environment', 'PASS', '.env file exists');
  } else {
    addResult('Environment', 'FAIL', '.env file not found at ' + envPath);
    addResult('Environment', 'INFO', 'Create .env file from example.env and configure SMTP settings');
  }

  // 2. Check SMTP configuration
  console.log('Checking SMTP configuration...');
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM;

  if (!smtpHost) {
    addResult('SMTP Config', 'FAIL', 'SMTP_HOST not configured in .env');
  } else {
    addResult('SMTP Config', 'PASS', `SMTP_HOST: ${smtpHost}`);
  }

  if (!smtpUser) {
    addResult('SMTP Config', 'WARNING', 'SMTP_USER not configured (optional for some servers)');
  } else {
    addResult('SMTP Config', 'PASS', `SMTP_USER: ${smtpUser}`);
  }

  if (!smtpPass) {
    addResult('SMTP Config', 'WARNING', 'SMTP_PASS not configured (optional for some servers)');
  } else {
    addResult('SMTP Config', 'PASS', 'SMTP_PASS: ****** (configured)');
  }

  if (!smtpFrom) {
    addResult('SMTP Config', 'WARNING', 'SMTP_FROM not configured (will use default)');
  } else {
    addResult('SMTP Config', 'PASS', `SMTP_FROM: ${smtpFrom}`);
  }

  // 3. Test SMTP connection
  if (smtpHost) {
    console.log('Testing SMTP connection...');
    try {
      const smtpTest = await verifySMTPTransport();
      if (smtpTest.ok) {
        addResult('SMTP Connection', 'PASS', 'Successfully connected to SMTP server');
      } else {
        addResult('SMTP Connection', 'FAIL', 'Failed to connect to SMTP server', { error: smtpTest.error });
      }
    } catch (error: any) {
      addResult('SMTP Connection', 'FAIL', 'SMTP connection test failed', { error: error.message });
    }
  }

  // 4. Initialize database
  console.log('Connecting to database...');
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    addResult('Database', 'PASS', 'Successfully connected to database');
  } catch (error: any) {
    addResult('Database', 'FAIL', 'Failed to connect to database', { error: error.message });
    printResults();
    process.exit(1);
  }

  // 5. Check monitors
  console.log('Checking monitor configurations...');
  const monitorRepo = AppDataSource.getRepository(Monitor);
  const monitors = await monitorRepo.find({ take: 10 });

  if (monitors.length === 0) {
    addResult('Monitors', 'WARNING', 'No monitors found in database');
  } else {
    addResult('Monitors', 'INFO', `Found ${monitors.length} monitor(s) (showing first 10)`);
    
    monitors.forEach(monitor => {
      const issues: string[] = [];
      
      if (!monitor.active) {
        issues.push('inactive');
      }
      if (monitor.is_paused) {
        issues.push('paused');
      }
      if (!monitor.notify_owner) {
        issues.push('notify_owner=false');
      }
      
      const status = issues.length > 0 ? 'WARNING' : 'PASS';
      const issueText = issues.length > 0 ? ` (⚠️ ${issues.join(', ')})` : '';
      
      addResult('Monitors', status, `Monitor: ${monitor.name}${issueText}`, {
        id: monitor.id,
        type: monitor.type,
        target: monitor.target,
        active: monitor.active,
        is_paused: monitor.is_paused,
        notify_owner: monitor.notify_owner,
        email_recipients: monitor.email_recipients || 'none',
        last_status: monitor.last_status,
        last_check: monitor.last_check
      });
    });
  }

  // 6. Check users
  console.log('Checking user email addresses...');
  const userRepo = AppDataSource.getRepository(User);
  const users = await userRepo.find();

  if (users.length === 0) {
    addResult('Users', 'FAIL', 'No users found in database');
  } else {
    users.forEach(user => {
      if (!user.email) {
        addResult('Users', 'FAIL', `User "${user.name}" has no email address configured`, { 
          id: user.id, 
          name: user.name 
        });
      } else {
        addResult('Users', 'PASS', `User "${user.name}" email: ${user.email}`, {
          id: user.id,
          name: user.name,
          email: user.email
        });
      }
    });
  }

  // 7. Check recent notifications (notifications table - used by checkEngine)
  console.log('Checking recent email notifications...');
  try {
    const notificationRepo = AppDataSource.getRepository(Notification);
    const recentNotifications = await notificationRepo.find({
      order: { sent_at: 'DESC' },
      take: 5
    });

    if (recentNotifications.length === 0) {
      addResult('Recent Notifications', 'INFO', 'No email notifications have been sent yet');
    } else {
      addResult('Recent Notifications', 'INFO', `Found ${recentNotifications.length} recent notification(s)`);
      
      recentNotifications.forEach(notif => {
        const monitor = monitors.find(m => m.id === notif.monitor_id);
        addResult('Recent Notifications', 'INFO', 
          `${notif.event_type.toUpperCase()} notification sent to ${notif.sent_to}`, {
            monitor: monitor?.name || notif.monitor_id,
            sent_at: notif.sent_at,
            time_ago: `${Math.round((Date.now() - notif.sent_at.getTime()) / 60000)} minutes ago`
          });
      });
    }
  } catch (error: any) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      addResult('Recent Notifications', 'FAIL', 'notifications table does not exist in database!');
      addResult('Recent Notifications', 'INFO', 'This is why emails are not being sent - the table to track notifications is missing');
      addResult('Recent Notifications', 'INFO', 'Run the create-notifications-table script to fix this');
    } else {
      addResult('Recent Notifications', 'FAIL', 'Error querying notifications', { error: error.message });
    }
  }

  // 8. Send test email (if requested)
  const testEmail = process.argv[2];
  if (testEmail) {
    console.log(`\nSending test email to ${testEmail}...`);
    
    const testMonitor = monitors.find(m => m.active);
    if (!testMonitor) {
      addResult('Test Email', 'FAIL', 'No active monitor found to use for test');
    } else {
      try {
        await sendTestNotificationEmail(testMonitor, testEmail);
        addResult('Test Email', 'PASS', `Test email sent successfully to ${testEmail}`);
      } catch (error: any) {
        addResult('Test Email', 'FAIL', `Failed to send test email to ${testEmail}`, { 
          error: error.message 
        });
      }
    }
  }

  // Print all results
  printResults();

  // Provide recommendations
  console.log('\n💡 RECOMMENDATIONS:\n');
  
  const failedChecks = results.filter(r => r.status === 'FAIL');
  if (failedChecks.length > 0) {
    console.log('1. Fix the CRITICAL issues marked with ❌ above');
  }
  
  const hasInactiveMonitors = results.some(r => 
    r.category === 'Monitors' && r.details?.notify_owner === false
  );
  
  if (hasInactiveMonitors) {
    console.log('2. Enable "notify_owner" for monitors that should send email alerts');
    console.log('   - Update in the UI or run: UPDATE monitors SET notify_owner=1 WHERE id="monitor-id"');
  }

  const hasNoEmail = results.some(r => 
    r.category === 'Users' && r.status === 'FAIL'
  );
  
  if (hasNoEmail) {
    console.log('3. Add email address to user account');
    console.log('   - Update in the UI or run: UPDATE users SET email="your@email.com" WHERE id=1');
  }

  if (results.some(r => r.category === 'SMTP Connection' && r.status === 'FAIL')) {
    console.log('4. Fix SMTP configuration:');
    console.log('   - For Gmail: Use App Password (not regular password)');
    console.log('   - For Gmail: SMTP_PORT=587, SMTP_SECURE=false');
    console.log('   - Verify firewall allows outbound SMTP connections');
  }

  console.log('\n📧 To send a test email, run:');
  console.log('   npm run diagnose-email your@email.com\n');

  await AppDataSource.destroy();
}

diagnose().catch(error => {
  console.error('❌ Diagnostic failed:', error);
  process.exit(1);
});
