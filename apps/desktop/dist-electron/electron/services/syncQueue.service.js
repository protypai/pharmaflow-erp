"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateDeviceId = getOrCreateDeviceId;
exports.updateLocalSyncStatus = updateLocalSyncStatus;
exports.getLocalSyncStatus = getLocalSyncStatus;
exports.addToSyncQueue = addToSyncQueue;
exports.pushPendingQueue = pushPendingQueue;
exports.getPendingCount = getPendingCount;
const axios_1 = __importDefault(require("axios"));
const localDb_service_1 = require("./localDb.service");
const logger_1 = require("./logger");
const keytar_1 = __importDefault(require("keytar"));
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const API_URL = process.env.VITE_CLOUD_API_URL || 'http://168.144.179.128';
const APP_VERSION = process.env.VITE_APP_VERSION || '1.0.0';
const SERVICE_NAME = 'PharmaFlowERP';
const ACCOUNT_NAME = 'access_token';
function getOrCreateDeviceId() {
    try {
        const userDataPath = electron_1.app.getPath('userData');
        const filePath = path_1.default.join(userDataPath, 'device_id.json');
        if (fs_1.default.existsSync(filePath)) {
            const data = JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
            if (data.deviceId)
                return data.deviceId;
        }
        const deviceId = (0, uuid_1.v4)();
        fs_1.default.writeFileSync(filePath, JSON.stringify({ deviceId }), 'utf-8');
        return deviceId;
    }
    catch (err) {
        logger_1.logger.error('Failed to get or create deviceId', { error: err.message });
        return 'unknown-device';
    }
}
function updateLocalSyncStatus(status, recordsUploaded, errorMessage) {
    try {
        const db = (0, localDb_service_1.getDb)();
        const nextSyncTime = new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const lastSyncTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        if (status === 'Success') {
            db.prepare(`
        UPDATE sync_status 
        SET status = ?, last_sync_time = ?, last_successful_sync = ?, records_uploaded = ?, error_message = NULL, next_sync_time = ?, updated_at = datetime('now')
        WHERE id = 'current'
      `).run(status, lastSyncTime, lastSyncTime, recordsUploaded, nextSyncTime);
        }
        else if (status === 'Failed') {
            db.prepare(`
        UPDATE sync_status 
        SET status = ?, last_sync_time = ?, error_message = ?, next_sync_time = ?, updated_at = datetime('now')
        WHERE id = 'current'
      `).run(status, lastSyncTime, errorMessage || 'Unknown Error', nextSyncTime);
        }
        else {
            db.prepare(`
        UPDATE sync_status 
        SET status = ?, next_sync_time = NULL, updated_at = datetime('now')
        WHERE id = 'current'
      `).run(status);
        }
    }
    catch (err) {
        logger_1.logger.error('Failed to update local sync status table', { error: err.message });
    }
}
function getLocalSyncStatus() {
    try {
        const db = (0, localDb_service_1.getDb)();
        const row = db.prepare('SELECT * FROM sync_status WHERE id = "current"').get();
        return row || { status: 'Success' };
    }
    catch (err) {
        return { status: 'Success' };
    }
}
function addToSyncQueue(tableName, operation, payload) {
    const db = (0, localDb_service_1.getDb)();
    const id = payload.id;
    db.prepare(`
    INSERT OR REPLACE INTO sync_queue (id, table_name, operation, payload, app_version, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run(id, tableName, operation, JSON.stringify(payload), APP_VERSION);
}
async function sendTelemetryHealth(accessToken, status, errorMessage) {
    try {
        const deviceId = getOrCreateDeviceId();
        const pendingCount = getPendingCount();
        await axios_1.default.post(`${API_URL}/api/sync/health`, {
            deviceId,
            appVersion: APP_VERSION,
            status,
            errorMessage,
            pendingRecords: pendingCount,
            osPlatform: process.platform,
        }, { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 15000 });
    }
    catch (err) {
        logger_1.logger.warn('Failed to send sync health telemetry to cloud', { error: err.message });
    }
}
async function pushPendingQueue(accessToken, refreshToken) {
    const db = (0, localDb_service_1.getDb)();
    // Set local state to Syncing...
    updateLocalSyncStatus('Syncing...', 0);
    const pending = db.prepare(`
    SELECT * FROM sync_queue WHERE is_synced = 0 ORDER BY created_at ASC LIMIT 100
  `).all();
    if (pending.length === 0) {
        updateLocalSyncStatus('Success', 0);
        sendTelemetryHealth(accessToken, 'Success').catch(() => { });
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
        const response = await axios_1.default.post(`${API_URL}/api/sync/push`, { items }, { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 30000 });
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
        sendTelemetryHealth(accessToken, 'Success').catch(() => { });
        return { success, failed };
    }
    catch (err) {
        if (err?.response?.status === 401 && refreshToken) {
            try {
                logger_1.logger.info('Access token expired during sync push, attempting refresh...');
                const refreshRes = await axios_1.default.post(`${API_URL}/api/v1/auth/refresh`, { refreshToken }, { timeout: 15000 });
                if (refreshRes.data?.success && refreshRes.data?.data?.accessToken) {
                    const newAccessToken = refreshRes.data.data.accessToken;
                    await keytar_1.default.setPassword(SERVICE_NAME, ACCOUNT_NAME, newAccessToken);
                    // Retry sync push with new access token
                    const retryRes = await axios_1.default.post(`${API_URL}/api/sync/push`, { items }, { headers: { Authorization: `Bearer ${newAccessToken}` }, timeout: 30000 });
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
                    sendTelemetryHealth(newAccessToken, 'Success').catch(() => { });
                    return { success, failed };
                }
            }
            catch (refreshErr) {
                logger_1.logger.error('Token refresh failed during sync', { error: refreshErr.message });
            }
        }
        logger_1.logger.error('Sync push failed', { error: err.message });
        // Update local status table to Failed
        updateLocalSyncStatus('Failed', 0, err.message);
        sendTelemetryHealth(accessToken, 'Failed', err.message).catch(() => { });
        // Increment retry count
        db.prepare(`
      UPDATE sync_queue SET retry_count = retry_count + 1 WHERE is_synced = 0
    `).run();
        throw err;
    }
}
function getPendingCount() {
    try {
        const db = (0, localDb_service_1.getDb)();
        const row = db.prepare('SELECT COUNT(*) as count FROM sync_queue WHERE is_synced = 0').get();
        return row?.count ?? 0;
    }
    catch {
        return 0;
    }
}
