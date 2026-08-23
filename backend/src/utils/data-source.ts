import { DataSource } from 'typeorm';
import { Monitor } from '../models/Monitor';
import { CheckLog } from '../models/CheckLog';
import { User } from '../models/User';
import { UserNotification } from '../models/UserNotification';
import { Notification } from '../models/Notification';
import { MonitorTag } from '../models/MonitorTag';
import { MonitorDependency } from '../models/MonitorDependency';
import { AppSetting } from '../models/AppSetting';

const shouldSync = process.env.DB_SYNC === 'true';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'hmhms_db',
  entities: [
    User,
    Monitor,
    CheckLog,
    UserNotification,
    Notification,
    MonitorTag,
    MonitorDependency,
    AppSetting
  ],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
  // Disable auto-sync by default to avoid accidental destructive schema ops
  // Enable only when you explicitly set DB_SYNC=true in your environment
  synchronize: shouldSync,
  logging: false,
});
