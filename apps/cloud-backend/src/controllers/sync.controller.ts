import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { processSyncQueue, getChanges } from '../services/sync.service';
import { logActivity, hasRecentActivity } from '../services/activityLog.service';
import { db } from '../config/database';

export const pushSync = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { items, deviceId, appVersion } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ success: false, message: 'items must be an array' });
  }
  const result = await processSyncQueue(companyId, items, deviceId, appVersion);

  // Log the ACTUAL server-side rejection reason so the Super Admin can diagnose a
  // customer's sync problem remotely — no need to access their machine. Throttled
  // to one entry per company per 15 min so retries don't flood the audit trail.
  if (result.failedCount > 0) {
    const itemById = new Map((items as any[]).map((it) => [it.id, it]));
    const reasonOf = (err: any): string => {
      const lines = String(err || '').split('\n').map((l) => l.trim()).filter(Boolean);
      const key = lines.find((l) => /foreign key|invalid value|expected|unique constraint|argument|not found|forbidden/i.test(l));
      return key || lines[lines.length - 1] || 'unknown error';
    };
    const distinct = [...new Set(
      (result.results as any[])
        .filter((r) => r.status === 'failed')
        .map((r) => `${itemById.get(r.queueId)?.tableName || '?'}: ${reasonOf(r.error)}`)
    )];
    if (!(await hasRecentActivity(companyId, 'sync.rejected', 15))) {
      await logActivity({
        companyId, actorType: 'user', action: 'sync.rejected', targetType: 'device', targetId: deviceId || null,
        detail: `${result.failedCount} record(s) rejected (v${appVersion || '?'}) — ${distinct.join(' | ')}`.slice(0, 600),
      });
    }
  }

  // Log a successful backup event so the Super Admin's "Backups" view shows a
  // per-store history (not just the last-sync time). Throttled to 1/min per
  // company so rapid saves don't flood the audit trail.
  if (result.successCount > 0) {
    if (!(await hasRecentActivity(companyId, 'backup.synced', 1))) {
      await logActivity({
        companyId, actorType: 'user', action: 'backup.synced', targetType: 'device', targetId: deviceId || null,
        detail: `${result.successCount} record(s) backed up to cloud (v${appVersion || '?'})`,
      });
    }
  }

  sendSuccess(
    res,
    result,
    `Sync complete: ${result.successCount} succeeded, ${result.failedCount} failed`,
  );
});

export const getSyncChanges = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const sinceRaw = req.query.since as string | undefined;
  let since: Date | undefined;
  if (sinceRaw) {
    const parsed = new Date(sinceRaw);
    if (isNaN(parsed.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid "since" timestamp' });
    }
    since = parsed;
  }

  const changes = await getChanges(companyId, since);
  sendSuccess(res, { serverTime: new Date().toISOString(), changes }, 'Changes fetched');
});

export const getSyncStatus = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const pending = await (db.syncQueue?.count({
    where: { companyId, isSynced: false },
  }) ?? 0);
  sendSuccess(res, { pending }, 'Sync status');
});

export const getInitialSyncData = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;

  // Fetch all related records for the company sequentially to avoid database connection pool exhaustion
  const customers = await db.customer.findMany({ where: { companyId } });
  const suppliers = await db.supplier.findMany({ where: { companyId } });
  const products = await db.product.findMany({ where: { companyId } });
  const batches = await db.batch.findMany({ where: { product: { companyId } } });
  const manufacturers = await db.manufacturer.findMany({ where: { companyId } });
  const categories = await db.category.findMany({ where: { companyId } });
  const racks = await db.rack.findMany({ where: { companyId } });
  const sales = await db.sale.findMany({ where: { companyId } });
  const saleItems = await db.saleItem.findMany({ where: { sale: { companyId } } });
  const purchases = await db.purchase.findMany({ where: { companyId } });
  const purchaseItems = await db.purchaseItem.findMany({ where: { purchase: { companyId } } });
  const purchaseReturns = await db.purchaseReturn.findMany({ where: { companyId } });
  const purchaseReturnItems = await db.purchaseReturnItem.findMany({ where: { purchaseReturn: { companyId } } });
  const saleReturns = await db.saleReturn.findMany({ where: { companyId } });
  const saleReturnItems = await db.saleReturnItem.findMany({ where: { saleReturn: { companyId } } });
  const receipts = await db.receipt.findMany({ where: { companyId } });
  const payments = await db.payment.findMany({ where: { companyId } });
  const stockAdjustments = await db.stockAdjustment.findMany({ where: { companyId } });
  const stockAdjustmentItems = await db.stockAdjustmentItem.findMany({ where: { adjustment: { companyId } } });
  const journals = await db.journal.findMany({ where: { companyId } });
  const journalEntries = await db.journalEntry.findMany({ where: { journal: { companyId } } });

  sendSuccess(res, {
    customers, suppliers, products, batches,
    manufacturers, categories, racks,
    sales, saleItems, purchases, purchaseItems,
    purchaseReturns, purchaseReturnItems,
    saleReturns, saleReturnItems,
    receipts, payments,
    stockAdjustments, stockAdjustmentItems,
    journals, journalEntries
  }, 'Initial sync data fetched successfully');
});

export const saveSyncHealth = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { deviceId, appVersion, status, errorMessage, pendingRecords, osPlatform, backupStatus, backupError } = req.body;

  if (!deviceId || !status) {
    return res.status(400).json({ success: false, message: 'deviceId and status are required' });
  }

  const ver = appVersion || 'unknown';
  const dev = osPlatform || 'device';

  // Connectivity/transport failures → audit log (record-level rejections are logged
  // authoritatively as 'sync.rejected' on push, so we only log hard 'Failed' here).
  // Throttled to 1 per 15 min per company so a persistently-offline client can't flood it.
  if (status === 'Failed') {
    if (!(await hasRecentActivity(companyId, 'sync.failed', 15))) {
      await logActivity({
        companyId, actorType: 'user', action: 'sync.failed', targetType: 'device', targetId: deviceId,
        detail: `Sync failed on ${dev} (v${ver}) — ${errorMessage || 'could not reach server'}; ${pendingRecords || 0} pending`,
      });
    }
  }

  // Backup results (sent only when a backup actually runs, so no throttle needed
  // for success; failures throttled lightly).
  if (backupStatus === 'Failed') {
    if (!(await hasRecentActivity(companyId, 'backup.failed', 15))) {
      await logActivity({
        companyId, actorType: 'user', action: 'backup.failed', targetType: 'device', targetId: deviceId,
        detail: `Backup failed (v${ver}) — ${backupError || 'unknown error'}`,
      });
    }
  } else if (backupStatus === 'Success') {
    await logActivity({
      companyId, actorType: 'user', action: 'backup.completed', targetType: 'device', targetId: deviceId,
      detail: `Backup completed (v${ver})`,
    });
  }

  const lastSuccessSync = status === 'Success' ? new Date() : undefined;

  await db.clientSyncHealth.upsert({
    where: { deviceId },
    update: {
      appVersion,
      lastSyncTime: new Date(),
      ...(lastSuccessSync ? { lastSuccessSync } : {}),
      status,
      errorMessage: errorMessage || null,
      pendingRecords: pendingRecords || 0,
      osPlatform,
    },
    create: {
      companyId,
      deviceId,
      appVersion,
      status,
      errorMessage: errorMessage || null,
      pendingRecords: pendingRecords || 0,
      osPlatform,
      lastSuccessSync,
    },
  });

  sendSuccess(res, {}, 'Sync health saved');
});

