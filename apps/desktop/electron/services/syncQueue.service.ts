import axios from 'axios';
import { getDb } from './localDb.service';
import { logger } from './logger';
import keytar from 'keytar';

const API_URL = process.env.VITE_CLOUD_API_URL || 'http://168.144.179.128';
const APP_VERSION = process.env.VITE_APP_VERSION || '1.0.0';
const SERVICE_NAME = 'PharmaFlowERP';
const ACCOUNT_NAME = 'access_token';

export function addToSyncQueue(tableName: string, operation: 'create' | 'update' | 'delete', payload: any): void {
  const db = getDb();
  const id = payload.id;
  db.prepare(`
    INSERT OR REPLACE INTO sync_queue (id, table_name, operation, payload, app_version, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run(id, tableName, operation, JSON.stringify(payload), APP_VERSION);
}

export async function pushPendingQueue(accessToken: string, refreshToken?: string): Promise<{ success: number; failed: number }> {
  const db = getDb();
  const pending = db.prepare(`
    SELECT * FROM sync_queue WHERE is_synced = 0 ORDER BY created_at ASC LIMIT 100
  `).all() as any[];

  if (pending.length === 0) return { success: 0, failed: 0 };

  const items = pending.map(row => ({
    ...row,
    payload: JSON.parse(row.payload),
  }));

  try {
    const response = await axios.post(
      `${API_URL}/api/sync/push`,
      { items },
      { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 30000 }
    );

    const { success, failed } = response.data.data;

    // Mark synced items
    const successIds = items.slice(0, success).map(i => i.id);
    if (successIds.length > 0) {
      const placeholders = successIds.map(() => '?').join(',');
      db.prepare(`
        UPDATE sync_queue SET is_synced = 1, synced_at = datetime('now')
        WHERE id IN (${placeholders})
      `).run(...successIds);
    }

    return { success, failed };
  } catch (err: any) {
    if (err?.response?.status === 401 && refreshToken) {
      try {
        logger.info('Access token expired during sync push, attempting refresh...');
        const refreshRes = await axios.post(
          `${API_URL}/api/v1/auth/refresh`,
          { refreshToken },
          { timeout: 15000 }
        );
        if (refreshRes.data?.success && refreshRes.data?.data?.accessToken) {
          const newAccessToken = refreshRes.data.data.accessToken;
          await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, newAccessToken);
          
          // Retry sync push with new access token
          const retryRes = await axios.post(
            `${API_URL}/api/sync/push`,
            { items },
            { headers: { Authorization: `Bearer ${newAccessToken}` }, timeout: 30000 }
          );

          const { success, failed } = retryRes.data.data;
          const successIds = items.slice(0, success).map(i => i.id);
          if (successIds.length > 0) {
            const placeholders = successIds.map(() => '?').join(',');
            db.prepare(`
              UPDATE sync_queue SET is_synced = 1, synced_at = datetime('now')
              WHERE id IN (${placeholders})
            `).run(...successIds);
          }
          return { success, failed };
        }
      } catch (refreshErr: any) {
        logger.error('Token refresh failed during sync', { error: refreshErr.message });
      }
    }

    logger.error('Sync push failed', { error: err.message });
    // Increment retry count
    db.prepare(`
      UPDATE sync_queue SET retry_count = retry_count + 1 WHERE is_synced = 0
    `).run();
    throw err;
  }
}

export function getPendingCount(): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM sync_queue WHERE is_synced = 0').get() as any;
  return row?.count ?? 0;
}
