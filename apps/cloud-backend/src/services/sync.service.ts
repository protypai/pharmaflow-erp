import { db } from '../config/database';
import { logger } from '../utils/logger';

export const processSyncQueue = async (companyId: string, items: any[]) => {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const item of items) {
    try {
      const { tableName, operation, payload, recordId, deviceId, appVersion } = item;

      // Upsert into sync queue on cloud for audit trail
      await db.syncQueue.upsert({
        where: { id: recordId },
        update: { payload, isSynced: true, syncedAt: new Date() },
        create: {
          id: recordId,
          companyId,
          deviceId,
          tableName,
          recordId,
          operation,
          payload,
          isSynced: true,
          syncedAt: new Date(),
          appVersion,
        },
      });

      // Apply the actual data change based on table and operation
      await applyRecord(tableName, operation, payload, companyId);
      results.success++;
    } catch (err: any) {
      results.failed++;
      results.errors.push(`${item.recordId}: ${err.message}`);
      logger.error('Sync item failed', { item, error: err.message });
    }
  }

  return results;
};

async function applyRecord(tableName: string, operation: string, payload: any, companyId: string) {
  const tableMap: Record<string, any> = {
    Company: db.company,
    User: db.user,
    Sale: db.sale,
    Purchase: db.purchase,
    Receipt: db.receipt,
    Payment: db.payment,
    Customer: db.customer,
    Supplier: db.supplier,
    Product: db.product,
    Batch: db.batch,
    SaleReturn: db.saleReturn,
    PurchaseReturn: db.purchaseReturn,
    StockAdjustment: db.stockAdjustment,
    Journal: db.journal,
    Manufacturer: db.manufacturer,
    Category: db.category,
    Rack: db.rack,
    PurchaseItem: db.purchaseItem,
    SaleItem: db.saleItem,
    SaleReturnItem: db.saleReturnItem,
    PurchaseReturnItem: db.purchaseReturnItem,
  };

  const model = tableMap[tableName];
  if (!model) throw new Error(`Unknown table: ${tableName}`);

  // Special cases: tables that do not have a companyId column
  const noCompanyIdTables = ['Company', 'Batch', 'PurchaseItem', 'SaleItem', 'PurchaseReturnItem', 'SaleReturnItem', 'JournalEntry', 'StockAdjustmentItem'];
  const createPayload = noCompanyIdTables.includes(tableName) 
    ? { ...payload } 
    : { ...payload, companyId };

  if (operation === 'create') {
    await model.upsert({
      where: { id: payload.id },
      create: createPayload,
      update: payload,
    });
  } else if (operation === 'update') {
    await model.update({ where: { id: payload.id }, data: payload });
  } else if (operation === 'delete') {
    await model.update({ where: { id: payload.id }, data: { status: 'inactive' } });
  }
}
