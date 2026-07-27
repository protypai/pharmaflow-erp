import axios from 'axios';
import { getDb } from './localDb.service';
import { logger } from './logger';
import keytar from 'keytar';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const API_URL = process.env.VITE_CLOUD_API_URL || 'http://168.144.179.128';
const APP_VERSION = process.env.VITE_APP_VERSION || '1.0.0';
const SERVICE_NAME = 'PharmaFlowERP';
const ACCOUNT_NAME = 'access_token';

export function getOrCreateDeviceId(): string {
  try {
    const userDataPath = app.getPath('userData');
    const filePath = path.join(userDataPath, 'device_id.json');
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (data.deviceId) return data.deviceId;
    }
    const deviceId = uuidv4();
    fs.writeFileSync(filePath, JSON.stringify({ deviceId }), 'utf-8');
    return deviceId;
  } catch (err: any) {
    logger.error('Failed to get or create deviceId', { error: err.message });
    return 'unknown-device';
  }
}

export function updateLocalSyncStatus(
  status: 'Syncing...' | 'Success' | 'Failed',
  recordsUploaded: number,
  errorMessage?: string | null
): void {
  try {
    const db = getDb();
    const nextSyncTime = new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const lastSyncTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    if (status === 'Success') {
      db.prepare(`
        UPDATE sync_status 
        SET status = ?, last_sync_time = ?, last_successful_sync = ?, records_uploaded = ?, error_message = NULL, next_sync_time = ?, updated_at = datetime('now')
        WHERE id = 'current'
      `).run(status, lastSyncTime, lastSyncTime, recordsUploaded, nextSyncTime);
    } else if (status === 'Failed') {
      db.prepare(`
        UPDATE sync_status 
        SET status = ?, last_sync_time = ?, error_message = ?, next_sync_time = ?, updated_at = datetime('now')
        WHERE id = 'current'
      `).run(status, lastSyncTime, errorMessage || 'Unknown Error', nextSyncTime);
    } else {
      db.prepare(`
        UPDATE sync_status 
        SET status = ?, next_sync_time = NULL, updated_at = datetime('now')
        WHERE id = 'current'
      `).run(status);
    }
  } catch (err: any) {
    logger.error('Failed to update local sync status table', { error: err.message });
  }
}

export function getLocalSyncStatus(): any {
  try {
    const db = getDb();
    const row = db.prepare('SELECT * FROM sync_status WHERE id = "current"').get() as any;
    return row || { status: 'Success' };
  } catch (err: any) {
    return { status: 'Success' };
  }
}


export function addToSyncQueue(tableName: string, operation: 'create' | 'update' | 'delete', payload: any): void {
  const db = getDb();
  const id = payload.id;
  db.prepare(`
    INSERT OR REPLACE INTO sync_queue (id, table_name, operation, payload, app_version, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run(id, tableName, operation, JSON.stringify(payload), APP_VERSION);
}

async function sendTelemetryHealth(accessToken: string, status: 'Success' | 'Failed' | 'Syncing', errorMessage?: string | null): Promise<void> {
  try {
    const deviceId = getOrCreateDeviceId();
    const pendingCount = getPendingCount();
    await axios.post(
      `${API_URL}/api/sync/health`,
      {
        deviceId,
        appVersion: APP_VERSION,
        status,
        errorMessage,
        pendingRecords: pendingCount,
        osPlatform: process.platform,
      },
      { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 15000 }
    );
  } catch (err: any) {
    logger.warn('Failed to send sync health telemetry to cloud', { error: err.message });
  }
}

export async function pushPendingQueue(accessToken: string, refreshToken?: string): Promise<{ success: number; failed: number }> {
  const db = getDb();
  
  // Set local state to Syncing...
  updateLocalSyncStatus('Syncing...', 0);

  const pending = db.prepare(`
    SELECT * FROM sync_queue WHERE is_synced = 0 ORDER BY created_at ASC LIMIT 100
  `).all() as any[];

  if (pending.length === 0) {
    updateLocalSyncStatus('Success', 0);
    sendTelemetryHealth(accessToken, 'Success').catch(() => {});
    return { success: 0, failed: 0 };
  }

  // CamelCase map the columns for backend Prisma compatibility
  const items = pending.map(row => ({
    id: row.id,
    recordId: row.id,
    tableName: row.table_name,
    operation: row.operation,
    payload: JSON.parse(row.payload),
    appVersion: row.app_version,
    deviceId: row.device_id || getOrCreateDeviceId(),
    createdAt: row.created_at,
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

    // Update status to Success
    updateLocalSyncStatus('Success', success);
    sendTelemetryHealth(accessToken, 'Success').catch(() => {});

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

          updateLocalSyncStatus('Success', success);
          sendTelemetryHealth(newAccessToken, 'Success').catch(() => {});

          return { success, failed };
        }
      } catch (refreshErr: any) {
        logger.error('Token refresh failed during sync', { error: refreshErr.message });
      }
    }

    logger.error('Sync push failed', { error: err.message });
    
    // Update local status table to Failed
    updateLocalSyncStatus('Failed', 0, err.message);
    sendTelemetryHealth(accessToken, 'Failed', err.message).catch(() => {});

    // Increment retry count
    db.prepare(`
      UPDATE sync_queue SET retry_count = retry_count + 1 WHERE is_synced = 0
    `).run();
    throw err;
  }
}


export function getPendingCount(): number {
  try {
    const db = getDb();
    const row = db.prepare('SELECT COUNT(*) as count FROM sync_queue WHERE is_synced = 0').get() as any;
    return row?.count ?? 0;
  } catch {
    return 0;
  }
}
