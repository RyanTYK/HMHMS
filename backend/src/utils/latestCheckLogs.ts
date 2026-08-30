import { AppDataSource } from './data-source';

export type LatestCheckLog = { monitor_id: string; timestamp: Date; status: 'up' | 'down' };

// One query for "latest check log per monitor" instead of one findOne() per
// monitor - the naive per-monitor loop fires on every dashboard load and
// every SSE broadcast tick for every connected user.
export async function getLatestCheckLogs(monitorIds: string[]): Promise<Map<string, LatestCheckLog>> {
  const result = new Map<string, LatestCheckLog>();
  if (monitorIds.length === 0) return result;

  const placeholders = monitorIds.map(() => '?').join(',');
  const rows: LatestCheckLog[] = await AppDataSource.query(
    `SELECT monitor_id, timestamp, status FROM (
       SELECT monitor_id, timestamp, status,
              ROW_NUMBER() OVER (PARTITION BY monitor_id ORDER BY timestamp DESC) AS rn
       FROM check_logs
       WHERE monitor_id IN (${placeholders})
     ) ranked WHERE rn = 1`,
    monitorIds
  );

  for (const row of rows) result.set(row.monitor_id, row);
  return result;
}
