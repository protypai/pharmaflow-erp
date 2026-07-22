"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToSyncQueue = addToSyncQueue;
exports.pushPendingQueue = pushPendingQueue;
exports.getPendingCount = getPendingCount;
const axios_1 = __importDefault(require("axios"));
const localDb_service_1 = require("./localDb.service");
const logger_1 = require("./logger");
const API_URL = process.env.VITE_CLOUD_API_URL || 'https://api.pharmaflow.in';
const APP_VERSION = process.env.VITE_APP_VERSION || '1.0.0';
function addToSyncQueue(tableName, operation, payload) {
    const db = (0, localDb_service_1.getDb)();
    const id = payload.id;
    db.prepare(`
    INSERT OR REPLACE INTO sync_queue (id, table_name, operation, payload, app_version, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run(id, tableName, operation, JSON.stringify(payload), APP_VERSION);
}
async function pushPendingQueue(accessToken) {
    const db = (0, localDb_service_1.getDb)();
    const pending = db.prepare(`
    SELECT * FROM sync_queue WHERE is_synced = 0 ORDER BY created_at ASC LIMIT 100
  `).all();
    if (pending.length === 0)
        return { success: 0, failed: 0 };
    const items = pending.map(row => ({
        ...row,
        payload: JSON.parse(row.payload),
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
        return { success, failed };
    }
    catch (err) {
        logger_1.logger.error('Sync push failed', { error: err.message });
        // Increment retry count
        db.prepare(`
      UPDATE sync_queue SET retry_count = retry_count + 1 WHERE is_synced = 0
    `).run();
        throw err;
    }
}
function getPendingCount() {
    const db = (0, localDb_service_1.getDb)();
    const row = db.prepare('SELECT COUNT(*) as count FROM sync_queue WHERE is_synced = 0').get();
    return row?.count ?? 0;
}
