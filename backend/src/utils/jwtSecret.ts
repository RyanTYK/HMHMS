import crypto from 'crypto';
import { AppDataSource } from './data-source';
import { AppSetting } from '../models/AppSetting';

const SETTING_KEY = 'jwt_secret';

let cachedSecret = process.env.JWT_SECRET || 'changeme';

// Call once at startup, after AppDataSource.initialize() and before the
// server accepts requests. If JWT_SECRET isn't set in the environment,
// generate one and persist it in app_settings so every restart (and every
// process - API, worker) reuses the same value instead of invalidating
// everyone's session, mirroring how tools like Uptime Kuma self-generate
// their signing secret on first run.
export async function initJwtSecret(): Promise<void> {
  if (process.env.JWT_SECRET) {
    cachedSecret = process.env.JWT_SECRET;
    return;
  }

  const repo = AppDataSource.getRepository(AppSetting);
  const existing = await repo.findOne({ where: { key: SETTING_KEY } });
  if (existing) {
    cachedSecret = existing.value;
    return;
  }

  const generated = crypto.randomBytes(48).toString('hex');
  await repo.save(repo.create({ key: SETTING_KEY, value: generated }));
  cachedSecret = generated;
  console.log('[auth] No JWT_SECRET configured - generated and persisted a new signing secret.');
}

export function getJwtSecret(): string {
  return cachedSecret;
}
