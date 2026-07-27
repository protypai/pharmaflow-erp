import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { processSyncQueue } from '../services/sync.service';
import { db } from '../config/database';

export const pushSync = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ success: false, message: 'items must be an array' });
  }
  const result = await processSyncQueue(companyId, items);
  sendSuccess(res, result, `Sync complete: ${result.success} succeeded, ${result.failed} failed`);
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
  const { deviceId, appVersion, status, errorMessage, pendingRecords, osPlatform } = req.body;
  
  if (!deviceId || !status) {
    return res.status(400).json({ success: false, message: 'deviceId and status are required' });
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

