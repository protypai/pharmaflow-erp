import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { processSyncQueue } from '../services/sync.service';

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
  const pending = await (req.app.locals.db?.syncQueue?.count({
    where: { companyId, isSynced: false },
  }) ?? 0);
  sendSuccess(res, { pending }, 'Sync status');
});

export const getInitialSyncData = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const db = req.app.locals.db;
  
  if (!db) {
    return res.status(500).json({ success: false, message: 'Database not initialized' });
  }

  // Fetch all related records for the company
  const [
    customers, suppliers, products, batches,
    manufacturers, categories, racks,
    sales, saleItems, purchases, purchaseItems,
    purchaseReturns, purchaseReturnItems,
    saleReturns, saleReturnItems,
    receipts, payments,
    stockAdjustments, stockAdjustmentItems,
    journals, journalEntries
  ] = await Promise.all([
    db.customer.findMany({ where: { companyId } }),
    db.supplier.findMany({ where: { companyId } }),
    db.product.findMany({ where: { companyId } }),
    db.batch.findMany({ where: { product: { companyId } } }),
    db.manufacturer.findMany({ where: { companyId } }),
    db.category.findMany({ where: { companyId } }),
    db.rack.findMany({ where: { companyId } }),
    db.sale.findMany({ where: { companyId } }),
    db.saleItem.findMany({ where: { sale: { companyId } } }),
    db.purchase.findMany({ where: { companyId } }),
    db.purchaseItem.findMany({ where: { purchase: { companyId } } }),
    db.purchaseReturn.findMany({ where: { companyId } }),
    db.purchaseReturnItem.findMany({ where: { purchaseReturn: { companyId } } }),
    db.saleReturn.findMany({ where: { companyId } }),
    db.saleReturnItem.findMany({ where: { saleReturn: { companyId } } }),
    db.receipt.findMany({ where: { companyId } }),
    db.payment.findMany({ where: { companyId } }),
    db.stockAdjustment.findMany({ where: { companyId } }),
    db.stockAdjustmentItem.findMany({ where: { adjustment: { companyId } } }),
    db.journal.findMany({ where: { companyId } }),
    db.journalEntry.findMany({ where: { journal: { companyId } } })
  ]);

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
