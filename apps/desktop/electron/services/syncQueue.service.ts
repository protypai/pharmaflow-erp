import axios from 'axios';
import { getDb } from './localDb.service';
import { logger } from './logger';
import keytar from 'keytar';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Never hardcode a production host. Configure VITE_API_BASE_URL (or legacy
// VITE_CLOUD_API_URL) in the environment; fall back to a local dev backend.
// Resolve the API base URL LAZILY (at call time). The main process loads
// .env.production AFTER this module is imported, so evaluating it at import time
// would wrongly fall back to localhost in a packaged build (which is exactly why
// packaged apps "synced" locally but nothing reached the cloud). Packaged builds
// fall back to the production host — never localhost — so background sync can't
// silently POST to a dead localhost.
function getApiUrl(): string {
  return (
    process.env.VITE_API_BASE_URL ||
    process.env.VITE_CLOUD_API_URL ||
    (app.isPackaged ? 'https://sagarpharma.duckdns.org' : 'http://localhost:5000')
  );
}
// Real installed version (from package.json), not a hardcoded default.
const APP_VERSION = app.getVersion();
const SERVICE_NAME = 'PharmaFlowERP';
const ACCOUNT_NAME = 'access_token';

// Retry / backoff policy for the outbound sync queue.
const MAX_RETRIES = 5;               // rows beyond this are dead-lettered (is_synced = 2)
const BACKOFF_BASE_MS = 60 * 1000;   // 1 minute base
const BACKOFF_CAP_MS = 60 * 60 * 1000; // 1 hour cap

// is_synced states: 0 = pending, 1 = synced, 2 = dead-letter (poison record)
const SYNCED_PENDING = 0;
const SYNCED_DONE = 1;
const SYNCED_DEAD = 2;

export interface PushResult {
  success: number;
  failed: number;
  newAccessToken?: string;
  resyncRequestedAt?: string | null;
}

// Thrown when the server reports the user/company has been deactivated by the
// Super Admin. The IPC layer turns this into a forced logout in the renderer.
export class AccountDisabledError extends Error {
  constructor(message = 'Your account has been deactivated. Contact administrator.') {
    super(message);
    this.name = 'AccountDisabledError';
  }
}

// Server signals a disabled account with HTTP 403 + code 'ACCOUNT_DISABLED'
// (distinct from a 401 expired-token, which should be refreshed, not logged out).
function isAccountDisabled(err: any): boolean {
  return err?.response?.status === 403 && err?.response?.data?.code === 'ACCOUNT_DISABLED';
}

function computeNextRetryIso(retryCount: number): string {
  const delay = Math.min(BACKOFF_BASE_MS * Math.pow(2, retryCount), BACKOFF_CAP_MS);
  return new Date(Date.now() + delay).toISOString();
}

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
  status: 'Syncing...' | 'Success' | 'Partial' | 'Failed',
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
    } else if (status === 'Partial') {
      db.prepare(`
        UPDATE sync_status
        SET status = ?, last_sync_time = ?, records_uploaded = ?, error_message = ?, next_sync_time = ?, updated_at = datetime('now')
        WHERE id = 'current'
      `).run(status, lastSyncTime, recordsUploaded, errorMessage || 'Some records failed to sync', nextSyncTime);
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

export function getPullCursor(): string | null {
  try {
    const db = getDb();
    const row = db.prepare('SELECT pull_cursor FROM sync_status WHERE id = "current"').get() as any;
    return row?.pull_cursor || null;
  } catch {
    return null;
  }
}

function setPullCursor(cursor: string): void {
  try {
    const db = getDb();
    db.prepare(`UPDATE sync_status SET pull_cursor = ?, updated_at = datetime('now') WHERE id = 'current'`).run(cursor);
  } catch (err: any) {
    logger.error('Failed to persist pull cursor', { error: err.message });
  }
}

// --- Dead-letter recovery (admin-triggered "Retry stuck records") -------------

// Un-park dead-lettered rows (is_synced = 2) back to pending so they retry.
// Returns how many were revived.
export function unparkDeadLetters(): number {
  try {
    const db = getDb();
    const info = db.prepare(
      `UPDATE sync_queue SET is_synced = ${SYNCED_PENDING}, retry_count = 0, next_retry_at = NULL, sync_error = NULL WHERE is_synced = ${SYNCED_DEAD}`
    ).run();
    return info.changes || 0;
  } catch (err: any) {
    logger.error('Failed to un-park dead-lettered records', { error: err.message });
    return 0;
  }
}

function getResyncHandledAt(): string | null {
  try {
    const db = getDb();
    const row = db.prepare('SELECT resync_handled_at FROM sync_status WHERE id = "current"').get() as any;
    return row?.resync_handled_at || null;
  } catch { return null; }
}

function setResyncHandledAt(iso: string): void {
  try {
    getDb().prepare(`UPDATE sync_status SET resync_handled_at = ? WHERE id = 'current'`).run(iso);
  } catch (err: any) {
    logger.error('Failed to persist resync_handled_at', { error: err.message });
  }
}

// If the Super Admin requested a re-sync (newer than what we last handled),
// un-park the dead-lettered records so the next push retries them. Returns true
// if anything was revived (caller should push again).
export function maybeApplyResync(resyncRequestedAt: string | null | undefined): boolean {
  if (!resyncRequestedAt) return false;
  const handled = getResyncHandledAt();
  if (handled && new Date(resyncRequestedAt).getTime() <= new Date(handled).getTime()) return false;
  const revived = unparkDeadLetters();
  setResyncHandledAt(resyncRequestedAt);
  logger.info(`Admin re-sync requested — un-parked ${revived} dead-lettered record(s)`);
  return revived > 0;
}

export function addToSyncQueue(tableName: string, operation: 'create' | 'update' | 'delete', payload: any): void {
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO sync_queue (id, table_name, operation, record_id, company_id, payload, app_version, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(id, tableName, operation, payload.id ?? null, payload.companyId ?? payload.company_id ?? null, JSON.stringify(payload), APP_VERSION);
}

// Posts device health and returns the server's resyncRequestedAt (or null) so the
// caller can un-park dead-lettered records when the Super Admin requests a retry.
async function sendTelemetryHealth(accessToken: string, status: 'Success' | 'Partial' | 'Failed' | 'Syncing', errorMessage?: string | null): Promise<string | null> {
  try {
    const deviceId = getOrCreateDeviceId();
    const pendingCount = getPendingCount();
    const res = await axios.post(
      `${getApiUrl()}/api/sync/health`,
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
    return res.data?.data?.resyncRequestedAt || null;
  } catch (err: any) {
    logger.warn('Failed to send sync health telemetry to cloud', { error: err.message });
    return null;
  }
}

// Report a backup result to the cloud so backup failures/successes appear in the
// Super Admin audit log. Called only when a backup actually runs (not periodic).
export async function reportBackup(success: boolean, error?: string): Promise<void> {
  try {
    const token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
    if (!token) return;
    await axios.post(
      `${getApiUrl()}/api/sync/health`,
      {
        deviceId: getOrCreateDeviceId(),
        appVersion: APP_VERSION,
        status: getLocalSyncStatus().status || 'Success',
        pendingRecords: getPendingCount(),
        osPlatform: process.platform,
        backupStatus: success ? 'Success' : 'Failed',
        backupError: error || null,
      },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
    );
  } catch (err: any) {
    logger.warn('Failed to report backup result to cloud', { error: err.message });
  }
}

// "12/26" | "12/2026"  ->  ISO-8601 (last day of month). Cloud Batch.expiryDate
// is a DateTime and rejects MM/YY. Normalizing here also self-heals any rows that
// were queued before this fix.
function toIsoExpiry(v: any): any {
  if (!v) return null;
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  const m = s.match(/^(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!m) return null;
  const mon = parseInt(m[1], 10);
  const yr = m[2].length === 2 ? 2000 + parseInt(m[2], 10) : parseInt(m[2], 10);
  const d = new Date(Date.UTC(yr, mon, 0, 23, 59, 59));
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// Build the request payload the backend push endpoint expects.
function buildPushItems(rows: any[]) {
  return rows.map(row => {
    const payload = JSON.parse(row.payload);
    
    // Normalize date fields to standard ISO string required by Prisma backend
    if (payload) {
      if (payload.createdAt) payload.createdAt = new Date(payload.createdAt).toISOString();
      if (payload.updatedAt) payload.updatedAt = new Date(payload.updatedAt).toISOString();
      if (row.table_name === 'Purchase' && payload.invoiceDate) {
        payload.invoiceDate = new Date(payload.invoiceDate).toISOString();
      }
      if (row.table_name === 'Batch') {
        const parsedExpiry = toIsoExpiry(payload.expiryDate);
        // Fallback to 2099-12-31 to ensure Prisma doesn't reject it due to missing/invalid expiryDate
        payload.expiryDate = parsedExpiry ? parsedExpiry : new Date(Date.UTC(2099, 11, 31, 23, 59, 59)).toISOString();
      }
    }
    return {
      id: row.id,                       // sync_queue.id — echoed back as queueId
      tableName: row.table_name,
      operation: row.operation,
      recordId: row.record_id || row.id,
      payload,
    };
  });
}

// Apply the per-row results returned by the server. Only rows explicitly marked
// 'ok' are considered synced; 'failed' rows get retry_count bumped + error stored
// (and dead-lettered past MAX_RETRIES). Never touches unrelated rows.
function applyPushResults(results: Array<{ queueId: string; status: string; error?: string }>): void {
  const db = getDb();
  const markOk = db.prepare(`UPDATE sync_queue SET is_synced = ${SYNCED_DONE}, synced_at = datetime('now'), sync_error = NULL WHERE id = ?`);
  const getRetry = db.prepare('SELECT retry_count FROM sync_queue WHERE id = ?');
  const markFailed = db.prepare(`
    UPDATE sync_queue
    SET retry_count = retry_count + 1,
        sync_error = ?,
        last_attempt_at = datetime('now'),
        next_retry_at = ?,
        is_synced = ?
    WHERE id = ?
  `);

  const tx = db.transaction(() => {
    for (const r of results) {
      if (!r || !r.queueId) continue;
      if (r.status === 'ok') {
        markOk.run(r.queueId);
      } else {
        const current = getRetry.get(r.queueId) as any;
        const newRetry = (current?.retry_count ?? 0) + 1;
        const deadLetter = newRetry >= MAX_RETRIES ? SYNCED_DEAD : SYNCED_PENDING;
        markFailed.run(r.error || 'Rejected by server', computeNextRetryIso(newRetry), deadLetter, r.queueId);
      }
    }
  });
  tx();
}

// On a whole-request transport failure, bump retry/backoff for exactly the rows we
// attempted (and dead-letter any that exceed MAX_RETRIES) — never a blanket update.
function applyTransportFailure(rows: any[], errorMessage: string): void {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE sync_queue
    SET retry_count = retry_count + 1,
        sync_error = ?,
        last_attempt_at = datetime('now'),
        next_retry_at = ?,
        is_synced = CASE WHEN retry_count + 1 >= ${MAX_RETRIES} THEN ${SYNCED_DEAD} ELSE ${SYNCED_PENDING} END
    WHERE id = ?
  `);
  const tx = db.transaction(() => {
    for (const row of rows) {
      const newRetry = (row.retry_count ?? 0) + 1;
      stmt.run(errorMessage, computeNextRetryIso(newRetry), row.id);
    }
  });
  tx();
}

function selectPendingRows(): any[] {
  const db = getDb();
  const nowIso = new Date().toISOString();
  // Only rows that are pending, under the retry cap, and past their backoff window.
  // Order by dependency hierarchy first (parents before children) so FK constraints don't fail,
  // then by created_at.
  return db.prepare(`
    SELECT * FROM sync_queue
    WHERE is_synced = ${SYNCED_PENDING}
      AND retry_count < ${MAX_RETRIES}
      AND (next_retry_at IS NULL OR next_retry_at <= ?)
    ORDER BY 
      CASE table_name
        WHEN 'Company' THEN 1
        WHEN 'Category' THEN 2
        WHEN 'Manufacturer' THEN 3
        WHEN 'Rack' THEN 4
        WHEN 'Supplier' THEN 5
        WHEN 'Customer' THEN 6
        WHEN 'Product' THEN 7
        WHEN 'Batch' THEN 8
        WHEN 'Purchase' THEN 9
        WHEN 'PurchaseItem' THEN 10
        WHEN 'Sale' THEN 11
        WHEN 'SaleItem' THEN 12
        WHEN 'SaleReturn' THEN 13
        WHEN 'SaleReturnItem' THEN 14
        WHEN 'PurchaseReturn' THEN 15
        WHEN 'PurchaseReturnItem' THEN 16
        WHEN 'StockAdjustment' THEN 17
        WHEN 'StockAdjustmentItem' THEN 18
        WHEN 'Receipt' THEN 19
        WHEN 'Payment' THEN 20
        WHEN 'Journal' THEN 21
        WHEN 'JournalEntry' THEN 22
        ELSE 99
      END ASC,
      created_at ASC
    LIMIT 100
  `).all(nowIso) as any[];
}

export async function pushPendingQueue(accessToken: string, refreshToken?: string): Promise<PushResult> {
  const db = getDb();

  updateLocalSyncStatus('Syncing...', 0);

  const pending = selectPendingRows();

  if (pending.length === 0) {
    updateLocalSyncStatus('Success', 0);
    const resyncRequestedAt = await sendTelemetryHealth(accessToken, 'Success').catch(() => null);
    return { success: 0, failed: 0, resyncRequestedAt };
  }

  const items = buildPushItems(pending);
  let newAccessToken: string | undefined;
  let resyncRequestedAt: string | null = null;

  const doPush = async (token: string) => {
    const response = await axios.post(
      `${getApiUrl()}/api/v1/sync/push`,
      { items, appVersion: APP_VERSION, deviceId: getOrCreateDeviceId() },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 30000 }
    );
    return response.data?.data as {
      results: Array<{ queueId: string; status: string; error?: string }>;
      successCount: number;
      failedCount: number;
    };
  };

  try {
    let data;
    try {
      data = await doPush(accessToken);
    } catch (err: any) {
      if (isAccountDisabled(err)) throw new AccountDisabledError();
      // 401 → refresh access token once, propagate the new token, and retry.
      if (err?.response?.status === 401 && refreshToken) {
        logger.info('Access token expired during sync push, attempting refresh...');
        try {
          const refreshRes = await axios.post(
            `${getApiUrl()}/api/v1/auth/refresh`,
            { refreshToken },
            { timeout: 15000 }
          );
          if (refreshRes.data?.success && refreshRes.data?.data?.accessToken) {
            newAccessToken = refreshRes.data.data.accessToken;
            await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, newAccessToken!);
            data = await doPush(newAccessToken!);
          } else {
            throw err;
          }
        } catch (refreshErr: any) {
          // Refresh rejected because the account is disabled → force logout.
          if (isAccountDisabled(refreshErr)) throw new AccountDisabledError();
          throw refreshErr;
        }
      } else {
        throw err;
      }
    }

    const results = data?.results || [];
    const successCount = data?.successCount ?? results.filter(r => r.status === 'ok').length;
    const failedCount = data?.failedCount ?? results.filter(r => r.status !== 'ok').length;

    applyPushResults(results);

    if (failedCount > 0) {
      // Surface the ACTUAL server error(s) — not just a count — so the Super Admin
      // audit log shows the real cause (e.g. a bad field/constraint) and we can
      // diagnose production issues without database access.
      const distinctErrors = [...new Set(
        results.filter(r => r.status !== 'ok' && r.error).map(r => String(r.error).split('\n')[0].trim())
      )];
      const detail = distinctErrors.length
        ? `${failedCount} failed — ${distinctErrors.join(' | ')}`.slice(0, 500)
        : `${failedCount} record(s) failed to sync`;
      updateLocalSyncStatus('Partial', successCount, detail);
      resyncRequestedAt = await sendTelemetryHealth(newAccessToken || accessToken, 'Partial', detail).catch(() => null);
    } else {
      updateLocalSyncStatus('Success', successCount);
      resyncRequestedAt = await sendTelemetryHealth(newAccessToken || accessToken, 'Success').catch(() => null);
    }

    return { success: successCount, failed: failedCount, newAccessToken, resyncRequestedAt };
  } catch (err: any) {
    // Account disabled: not a retryable/transport failure — surface it so the
    // IPC layer can force a logout. Do NOT back off the rows (nothing is wrong
    // with them); they will sync once the account is reactivated.
    if (err instanceof AccountDisabledError) {
      updateLocalSyncStatus('Failed', 0, 'Account deactivated by administrator');
      throw err;
    }

    logger.error('Sync push failed', { error: err.message });

    // Transport-level failure: back off the attempted rows only.
    applyTransportFailure(pending, err.message);

    updateLocalSyncStatus('Failed', 0, err.message);
    sendTelemetryHealth(newAccessToken || accessToken, 'Failed', err.message).catch(() => {});

    throw err;
  }
}

// ---------------------------------------------------------------------------
// DELTA PULL — GET /api/v1/sync/changes?since=<cursor>, upsert into local sqlite
// in FK-safe order (parents before children), then persist serverTime as cursor.
// ---------------------------------------------------------------------------

// Cloud stores Batch.expiryDate as an ISO DateTime; locally we keep MM/YY text
// for display. Convert on pull so pulled batches match locally-created ones.
function isoToDisplayExpiry(v: any): string {
  if (!v) return '';
  const s = String(v);
  if (/^\d{1,2}\/\d{2,4}$/.test(s)) return s; // already MM/YY
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yy = String(d.getUTCFullYear()).slice(-2);
  return `${mm}/${yy}`;
}

type UpsertBuilder = (r: any) => { sql: string; params: any[] };

// changesKey -> builder. Order of this list is the FK-safe apply order.
const PULL_UPSERTS: Array<{ key: string; build: UpsertBuilder }> = [
  { key: 'companies', build: (c) => ({
    sql: `INSERT INTO companies (
            id, name, short_name, est_year, authorized_sign, address, city, pincode, state, state_code,
            gstin, pan, drug_license_20b, drug_license_21b, fssai_license, bank_name, bank_account, bank_ifsc, upi_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name=excluded.name, short_name=excluded.short_name, est_year=excluded.est_year, authorized_sign=excluded.authorized_sign,
            address=excluded.address, city=excluded.city, pincode=excluded.pincode, state=excluded.state, state_code=excluded.state_code,
            gstin=excluded.gstin, pan=excluded.pan, drug_license_20b=excluded.drug_license_20b, drug_license_21b=excluded.drug_license_21b,
            fssai_license=excluded.fssai_license, bank_name=excluded.bank_name, bank_account=excluded.bank_account, bank_ifsc=excluded.bank_ifsc, upi_id=excluded.upi_id`,
    params: [
      c.id, c.name, c.shortName, c.estYear, c.authorizedSign, c.address, c.city, c.pincode, c.state, c.stateCode,
      c.gstin, c.pan, c.drugLicense20B, c.drugLicense21B, c.fssaiLicense, c.bankName, c.bankAccount, c.bankIfsc, c.upiId
    ],
  }) },
  { key: 'categories', build: (c) => ({
    sql: 'INSERT OR REPLACE INTO categories (id, company_id, name, status) VALUES (?, ?, ?, ?)',
    params: [c.id, c.companyId, c.name, c.status],
  }) },
  { key: 'manufacturers', build: (m) => ({
    sql: 'INSERT OR REPLACE INTO manufacturers (id, company_id, name, status) VALUES (?, ?, ?, ?)',
    params: [m.id, m.companyId, m.name, m.status],
  }) },
  { key: 'racks', build: (r) => ({
    sql: 'INSERT OR REPLACE INTO racks (id, company_id, code, description, status) VALUES (?, ?, ?, ?, ?)',
    params: [r.id, r.companyId, r.code, r.description, r.status],
  }) },
  { key: 'suppliers', build: (s) => ({
    sql: 'INSERT OR REPLACE INTO suppliers (id, company_id, code, name, gstin, drug_license, drug_license_2, phone, email, address, city, state, pincode, credit_days, credit_limit, opening_balance, opening_balance_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    params: [s.id, s.companyId, s.code, s.name, s.gstin, s.drugLicense, s.drugLicense2, s.phone, s.email, s.address, s.city, s.state, s.pincode, s.creditDays, s.creditLimit, s.openingBalance, s.openingBalanceType, s.status],
  }) },
  { key: 'customers', build: (c) => ({
    sql: 'INSERT OR REPLACE INTO customers (id, company_id, code, name, type, gstin, drug_license, drug_license_2, phone, email, address, area, city, state, pincode, salesman, credit_limit, credit_days, opening_balance, opening_balance_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    params: [c.id, c.companyId, c.code, c.name, c.type, c.gstin, c.drugLicense, c.drugLicense2, c.phone, c.email, c.address, c.area, c.city, c.state, c.pincode, c.salesman, c.creditLimit, c.creditDays, c.openingBalance, c.openingBalanceType, c.status],
  }) },
  { key: 'products', build: (p) => ({
    sql: 'INSERT OR REPLACE INTO products (id, company_id, code, barcode, name, generic_name, manufacturer_id, category_id, rack_id, packing, purchase_unit, sale_unit, conversion_factor, hsn_code, gst_rate, min_stock, max_stock, reorder_qty, discontinued, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    params: [p.id, p.companyId, p.code, p.barcode, p.name, p.genericName, p.manufacturerId, p.categoryId, p.rackId, p.packing, p.purchaseUnit, p.saleUnit, p.conversionFactor, p.hsnCode, p.gstRate, p.minStock, p.maxStock, p.reorderQty, p.discontinued ? 1 : 0, p.status],
  }) },
  { key: 'batches', build: (b) => ({
    sql: 'INSERT OR REPLACE INTO batches (id, product_id, batch_no, expiry_date, mrp, ptr, pts, purchase_price, gst_rate, current_qty, free_qty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    params: [b.id, b.productId, b.batchNo, isoToDisplayExpiry(b.expiryDate), b.mrp, b.ptr, b.pts, b.purchasePrice, b.gstRate, b.currentQty, b.freeQty],
  }) },
  { key: 'sales', build: (item) => ({
    sql: `INSERT INTO sales (id, company_id, invoice_no, customer_id, date, salesman, gst_type, subtotal, discount_amount, taxable_amount, cgst_amount, sgst_amount, igst_amount, net_amount, round_off, payment_mode, paid_amount, notes, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET company_id=excluded.company_id, invoice_no=excluded.invoice_no, customer_id=excluded.customer_id, date=excluded.date, salesman=excluded.salesman, gst_type=excluded.gst_type, subtotal=excluded.subtotal, discount_amount=excluded.discount_amount, taxable_amount=excluded.taxable_amount, cgst_amount=excluded.cgst_amount, sgst_amount=excluded.sgst_amount, igst_amount=excluded.igst_amount, net_amount=excluded.net_amount, round_off=excluded.round_off, payment_mode=excluded.payment_mode, paid_amount=excluded.paid_amount, notes=excluded.notes, status=excluded.status, created_at=excluded.created_at, updated_at=excluded.updated_at`,
    params: [item.id, item.companyId, item.invoiceNo, item.customerId, item.date, item.salesman, item.gstType, item.subtotal, item.discountAmount, item.taxableAmount, item.cgstAmount, item.sgstAmount, item.igstAmount, item.netAmount, item.roundOff, item.paymentMode, item.paidAmount, item.notes, item.status, item.createdAt, item.updatedAt],
  }) },
  { key: 'saleItems', build: (item) => ({
    sql: 'INSERT OR REPLACE INTO sale_items (id, sale_id, product_id, batch_id, qty, mrp, ptr, sale_price, disc_percent, disc_amount, gst_rate, cgst, sgst, igst, taxable_amt, net_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    params: [item.id, item.saleId, item.productId, item.batchId, item.qty, item.mrp, item.ptr, item.salePrice, item.discPercent, item.discAmount, item.gstRate, item.cgst, item.sgst, item.igst, item.taxableAmt, item.netAmount],
  }) },
  { key: 'purchases', build: (item) => ({
    sql: `INSERT INTO purchases (id, company_id, entry_no, supplier_id, invoice_no, invoice_date, gst_type, subtotal, discount_amount, taxable_amount, cgst_amount, sgst_amount, igst_amount, net_amount, round_off, payment_mode, paid_amount, notes, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET company_id=excluded.company_id, entry_no=excluded.entry_no, supplier_id=excluded.supplier_id, invoice_no=excluded.invoice_no, invoice_date=excluded.invoice_date, gst_type=excluded.gst_type, subtotal=excluded.subtotal, discount_amount=excluded.discount_amount, taxable_amount=excluded.taxable_amount, cgst_amount=excluded.cgst_amount, sgst_amount=excluded.sgst_amount, igst_amount=excluded.igst_amount, net_amount=excluded.net_amount, round_off=excluded.round_off, payment_mode=excluded.payment_mode, paid_amount=excluded.paid_amount, notes=excluded.notes, status=excluded.status, created_at=excluded.created_at, updated_at=excluded.updated_at`,
    params: [item.id, item.companyId, item.entryNo, item.supplierId, item.invoiceNo, item.invoiceDate, item.gstType, item.subtotal, item.discountAmount, item.taxableAmount, item.cgstAmount, item.sgstAmount, item.igstAmount, item.netAmount, item.roundOff, item.paymentMode, item.paidAmount, item.notes, item.status, item.createdAt, item.updatedAt],
  }) },
  { key: 'purchaseItems', build: (item) => ({
    sql: 'INSERT OR REPLACE INTO purchase_items (id, purchase_id, product_id, batch_id, qty, free_qty, purchase_price, ptr, mrp, disc_percent, disc_amount, gst_rate, cgst, sgst, igst, taxable_amt, net_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    params: [item.id, item.purchaseId, item.productId, item.batchId, item.qty, item.freeQty, item.purchasePrice, item.ptr, item.mrp, item.discPercent, item.discAmount, item.gstRate, item.cgst, item.sgst, item.igst, item.taxableAmt, item.netAmount],
  }) },
  { key: 'receipts', build: (item) => ({
    sql: 'INSERT OR REPLACE INTO receipts (id, company_id, receipt_no, customer_id, date, amount, payment_mode, cheque_no, cheque_date, bank_name, utr_no, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    params: [item.id, item.companyId, item.receiptNo, item.customerId, item.date, item.amount, item.paymentMode, item.chequeNo, item.chequeDate, item.bankName, item.utrNo, item.notes, item.createdAt, item.updatedAt],
  }) },
  { key: 'payments', build: (item) => ({
    sql: 'INSERT OR REPLACE INTO payments (id, company_id, payment_no, supplier_id, date, amount, payment_mode, cheque_no, cheque_date, bank_name, utr_no, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    params: [item.id, item.companyId, item.paymentNo, item.supplierId, item.date, item.amount, item.paymentMode, item.chequeNo, item.chequeDate, item.bankName, item.utrNo, item.notes, item.createdAt, item.updatedAt],
  }) },
  { key: 'purchaseReturns', build: (item) => ({
    sql: `INSERT INTO purchase_returns (id, company_id, entry_no, purchase_id, supplier_id, return_date, reason, debit_note_no, net_amount, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET company_id=excluded.company_id, entry_no=excluded.entry_no, purchase_id=excluded.purchase_id, supplier_id=excluded.supplier_id, return_date=excluded.return_date, reason=excluded.reason, debit_note_no=excluded.debit_note_no, net_amount=excluded.net_amount, status=excluded.status, created_at=excluded.created_at, updated_at=excluded.updated_at`,
    params: [item.id, item.companyId, item.entryNo, item.purchaseId, item.supplierId, item.returnDate, item.reason, item.debitNoteNo, item.netAmount, item.status, item.createdAt, item.updatedAt],
  }) },
  { key: 'purchaseReturnItems', build: (item) => ({
    sql: 'INSERT OR REPLACE INTO purchase_return_items (id, return_id, product_id, batch_id, qty, free_qty, mrp, ptr, net_amount, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    params: [item.id, item.returnId, item.productId, item.batchId, item.qty, item.freeQty || 0, item.mrp, item.ptr, item.netAmount, item.reason],
  }) },
  { key: 'saleReturns', build: (item) => ({
    sql: `INSERT INTO sale_returns (id, company_id, entry_no, sale_id, customer_id, return_date, reason, credit_note_no, net_amount, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET company_id=excluded.company_id, entry_no=excluded.entry_no, sale_id=excluded.sale_id, customer_id=excluded.customer_id, return_date=excluded.return_date, reason=excluded.reason, credit_note_no=excluded.credit_note_no, net_amount=excluded.net_amount, status=excluded.status, created_at=excluded.created_at, updated_at=excluded.updated_at`,
    params: [item.id, item.companyId, item.entryNo, item.saleId, item.customerId, item.returnDate, item.reason, item.creditNoteNo, item.netAmount, item.status, item.createdAt, item.updatedAt],
  }) },
  { key: 'saleReturnItems', build: (item) => ({
    sql: 'INSERT OR REPLACE INTO sale_return_items (id, return_id, product_id, batch_id, qty, free_qty, mrp, sale_price, net_amount, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    params: [item.id, item.returnId, item.productId, item.batchId, item.qty, item.freeQty || 0, item.mrp, item.salePrice, item.netAmount, item.reason],
  }) },
  { key: 'stockAdjustments', build: (item) => ({
    sql: `INSERT INTO stock_adjustments (id, company_id, entry_no, date, type, reason, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET company_id=excluded.company_id, entry_no=excluded.entry_no, date=excluded.date, type=excluded.type, reason=excluded.reason, status=excluded.status, created_at=excluded.created_at, updated_at=excluded.updated_at`,
    params: [item.id, item.companyId, item.entryNo, item.date, item.type, item.reason, item.status, item.createdAt, item.updatedAt],
  }) },
  { key: 'stockAdjustmentItems', build: (item) => ({
    sql: 'INSERT OR REPLACE INTO stock_adjustment_items (id, adjustment_id, product_id, batch_id, previous_qty, new_qty, diff_qty) VALUES (?, ?, ?, ?, ?, ?, ?)',
    params: [item.id, item.adjustmentId, item.productId, item.batchId, item.previousQty, item.newQty, item.diffQty],
  }) },
  { key: 'journals', build: (item) => ({
    sql: `INSERT INTO journals (id, company_id, entry_no, date, type, reference, notes, total_debit, total_credit, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET company_id=excluded.company_id, entry_no=excluded.entry_no, date=excluded.date, type=excluded.type, reference=excluded.reference, notes=excluded.notes, total_debit=excluded.total_debit, total_credit=excluded.total_credit, status=excluded.status, created_at=excluded.created_at, updated_at=excluded.updated_at`,
    params: [item.id, item.companyId, item.entryNo, item.date, item.type, item.reference, item.notes, item.totalDebit, item.totalCredit, item.status, item.createdAt, item.updatedAt],
  }) },
  { key: 'journalEntries', build: (item) => ({
    sql: 'INSERT OR REPLACE INTO journal_entries (id, journal_id, account_id, account_type, account_name, debit, credit, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    params: [item.id, item.journalId, item.accountId, item.accountType, item.accountName, item.debit, item.credit, item.notes],
  }) },
];

export async function pullChanges(accessToken: string, refreshToken?: string): Promise<{ applied: number; serverTime?: string; newAccessToken?: string }> {
  const db = getDb();
  const since = getPullCursor();
  let newAccessToken: string | undefined;

  const doPull = async (token: string) => {
    const url = `${getApiUrl()}/api/v1/sync/changes` + (since ? `?since=${encodeURIComponent(since)}` : '');
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30000,
    });
    return response.data?.data as { serverTime: string; changes: Record<string, any[]> };
  };

  let data;
  try {
    data = await doPull(accessToken);
  } catch (err: any) {
    if (isAccountDisabled(err)) throw new AccountDisabledError();
    if (err?.response?.status === 401 && refreshToken) {
      logger.info('Access token expired during sync pull, attempting refresh...');
      try {
        const refreshRes = await axios.post(
          `${getApiUrl()}/api/v1/auth/refresh`,
          { refreshToken },
          { timeout: 15000 }
        );
        if (refreshRes.data?.success && refreshRes.data?.data?.accessToken) {
          newAccessToken = refreshRes.data.data.accessToken;
          await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, newAccessToken!);
          data = await doPull(newAccessToken!);
        } else {
          throw err;
        }
      } catch (refreshErr: any) {
        if (isAccountDisabled(refreshErr)) throw new AccountDisabledError();
        throw refreshErr;
      }
    } else {
      throw err;
    }
  }

  const changes = data?.changes || {};
  let applied = 0;

  const applyTx = db.transaction(() => {
    for (const { key, build } of PULL_UPSERTS) {
      const rows = changes[key];
      if (!Array.isArray(rows) || rows.length === 0) continue;
      for (const record of rows) {
        try {
          const { sql, params } = build(record);
          db.prepare(sql).run(...params);
          applied++;
        } catch (rowErr: any) {
          logger.warn(`pullChanges: failed to upsert ${key} row`, { error: rowErr.message });
        }
      }
    }
  });
  applyTx();

  if (data?.serverTime) {
    setPullCursor(data.serverTime);
  }

  logger.info('Delta pull applied', { applied, serverTime: data?.serverTime });
  return { applied, serverTime: data?.serverTime, newAccessToken };
}

export function getPendingCount(): number {
  try {
    const db = getDb();
    const row = db.prepare(`SELECT COUNT(*) as count FROM sync_queue WHERE is_synced = ${SYNCED_PENDING}`).get() as any;
    return row?.count ?? 0;
  } catch {
    return 0;
  }
}
