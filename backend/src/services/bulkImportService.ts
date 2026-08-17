import { AppDataSource } from '../utils/data-source';
import { Monitor } from '../models/Monitor';
import { MonitorTag } from '../models/MonitorTag';

interface CSVMonitor {
  name: string;
  url: string;
  method?: string;
  interval?: number;
  timeout?: number;
  retryInterval?: number;
  maxRetries?: number;
  tags?: string;
  teamId?: number;
  isPaused?: boolean;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export class BulkImportService {
  private monitorRepository = AppDataSource.getRepository(Monitor);
  private tagRepository = AppDataSource.getRepository(MonitorTag);

  /**
   * Parse CSV data
   */
  parseCSV(csvContent: string): CSVMonitor[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file is empty or contains only headers');
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validate required headers
    const requiredHeaders = ['name', 'url'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    // Parse rows
    const monitors: CSVMonitor[] = [];
    // Map lower-cased CSV headers onto the exact CSVMonitor property names
    const numericFields: Record<string, keyof CSVMonitor> = {
      interval: 'interval',
      timeout: 'timeout',
      retryinterval: 'retryInterval',
      maxretries: 'maxRetries',
      teamid: 'teamId'
    };

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        const value = values[index];

        switch (header) {
          case 'name':
          case 'url':
          case 'method':
          case 'tags':
            row[header] = value;
            break;
          case 'interval':
          case 'timeout':
          case 'retryinterval':
          case 'maxretries':
          case 'teamid': {
            const parsed = value ? parseInt(value, 10) : undefined;
            row[numericFields[header]] = Number.isNaN(parsed as number) ? undefined : parsed;
            break;
          }
          case 'ispaused':
            row.isPaused = (value || '').toLowerCase() === 'true';
            break;
        }
      });

      monitors.push(row as CSVMonitor);
    }

    return monitors;
  }

  /**
   * Validate monitors
   */
  validateMonitors(monitors: CSVMonitor[]): ValidationError[] {
    const errors: ValidationError[] = [];

    monitors.forEach((monitor, index) => {
      const row = index + 2; // +2 because index 0 is row 2 (after header)

      // Validate name
      if (!monitor.name || monitor.name.length === 0) {
        errors.push({ row, field: 'name', message: 'Name is required' });
      } else if (monitor.name.length > 255) {
        errors.push({ row, field: 'name', message: 'Name must be 255 characters or less' });
      }

      // Validate URL
      if (!monitor.url || monitor.url.length === 0) {
        errors.push({ row, field: 'url', message: 'URL is required' });
      } else {
        try {
          new URL(monitor.url);
        } catch {
          errors.push({ row, field: 'url', message: 'Invalid URL format' });
        }
      }

      // Validate method
      if (monitor.method) {
        const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH'];
        if (!validMethods.includes(monitor.method.toUpperCase())) {
          errors.push({ row, field: 'method', message: 'Invalid HTTP method' });
        }
      }

      // Validate interval
      if (monitor.interval !== undefined) {
        if (monitor.interval < 30) {
          errors.push({ row, field: 'interval', message: 'Interval must be at least 30 seconds' });
        }
      }

      // Validate timeout
      if (monitor.timeout !== undefined) {
        if (monitor.timeout < 5 || monitor.timeout > 300) {
          errors.push({ row, field: 'timeout', message: 'Timeout must be between 5 and 300 seconds' });
        }
      }

      // Validate retry interval
      if (monitor.retryInterval !== undefined) {
        if (monitor.retryInterval < 10) {
          errors.push({ row, field: 'retryInterval', message: 'Retry interval must be at least 10 seconds' });
        }
      }

      // Validate max retries
      if (monitor.maxRetries !== undefined) {
        if (monitor.maxRetries < 0 || monitor.maxRetries > 10) {
          errors.push({ row, field: 'maxRetries', message: 'Max retries must be between 0 and 10' });
        }
      }
    });

    return errors;
  }

  /**
   * Create monitors from CSV data
   */
  async importMonitors(
    monitors: CSVMonitor[],
    userId: number
  ): Promise<{ created: number; failed: number; errors: any[] }> {
    let created = 0;
    let failed = 0;
    const errors: any[] = [];

    for (let i = 0; i < monitors.length; i++) {
      const monitorData = monitors[i];
      const row = i + 2;

      try {
        // Generate monitor ID
        const monitorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create monitor
        const monitor = this.monitorRepository.create({
          id: monitorId,
          name: monitorData.name,
          target: monitorData.url,
          type: 'http',
          interval_seconds: monitorData.interval || 60,
          timeout_ms: (monitorData.timeout || 30) * 1000,
          retry_interval: monitorData.retryInterval || 60,
          max_retries: monitorData.maxRetries || 3,
          is_paused: monitorData.isPaused || false,
          user_id: userId,
          team_id: monitorData.teamId || undefined
        });

        const savedMonitor = await this.monitorRepository.save(monitor);

        // Create tags if provided
        if (monitorData.tags) {
          const tagNames = monitorData.tags.split(';').map(t => t.trim()).filter(t => t.length > 0);
          
          for (const tagName of tagNames) {
            const tag = this.tagRepository.create({
              monitor_id: savedMonitor.id,
              tag: tagName
            });
            await this.tagRepository.save(tag);
          }
        }

        created++;
      } catch (error: any) {
        failed++;
        errors.push({
          row,
          name: monitorData.name,
          error: error.message
        });
      }
    }

    return { created, failed, errors };
  }

  /**
   * Generate sample CSV template
   */
  generateTemplate(): string {
    const headers = 'name,url,method,interval,timeout,retryInterval,maxRetries,tags,teamId,isPaused';
    const example1 = 'Google,https://google.com,GET,60,30,60,3,search;public,,false';
    const example2 = 'API Endpoint,https://api.example.com/health,GET,120,15,30,2,api;production,,false';
    
    return `${headers}\n${example1}\n${example2}`;
  }
}

export const bulkImportService = new BulkImportService();
