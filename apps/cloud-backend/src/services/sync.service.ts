import { db } from '../config/database';
import { logger } from '../utils/logger';

// ─── Model metadata ─────────────────────────────────────────────────────────

type DeleteStrategy = 'statusInactive' | 'txnCancel' | 'isActiveFalse' | 'hardDelete';

interface ModelMeta {
  key: string; // Prisma delegate name on `db` / `tx`
  hasCompanyId: boolean;
  hasUpdatedAt: boolean;
  deleteStrategy: DeleteStrategy;
  // Child tables (no companyId of their own) are scoped via their parent.
  parent?: { fk: string; delegateKey: string };
}

const MODELS: Record<string, ModelMeta> = {
  Company: { key: 'company', hasCompanyId: false, hasUpdatedAt: true, deleteStrategy: 'isActiveFalse' },
  User: { key: 'user', hasCompanyId: true, hasUpdatedAt: true, deleteStrategy: 'isActiveFalse' },
  Manufacturer: { key: 'manufacturer', hasCompanyId: true, hasUpdatedAt: true, deleteStrategy: 'statusInactive' },
  Category: { key: 'category', hasCompanyId: true, hasUpdatedAt: true, deleteStrategy: 'statusInactive' },
  Rack: { key: 'rack', hasCompanyId: true, hasUpdatedAt: true, deleteStrategy: 'statusInactive' },
  Product: { key: 'product', hasCompanyId: true, hasUpdatedAt: true, deleteStrategy: 'statusInactive' },
  Customer: { key: 'customer', hasCompanyId: true, hasUpdatedAt: true, deleteStrategy: 'statusInactive' },
  Supplier: { key: 'supplier', hasCompanyId: true, hasUpdatedAt: true, deleteStrategy: 'statusInactive' },
  Sale: { key: 'sale', hasCompanyId: true, hasUpdatedAt: true, deleteStrategy: 'txnCancel' },
  Purchase: { key: 'purchase', hasCompanyId: true, hasUpdatedAt: true, deleteStrategy: 'txnCancel' },
  SaleReturn: { key: 'saleReturn', hasCompanyId: true, hasUpdatedAt: true, deleteStrategy: 'txnCancel' },
  PurchaseReturn: { key: 'purchaseReturn', hasCompanyId: true, hasUpdatedAt: true, deleteStrategy: 'txnCancel' },
  Receipt: { key: 'receipt', hasCompanyId: true, hasUpdatedAt: true, deleteStrategy: 'hardDelete' },
  Payment: { key: 'payment', hasCompanyId: true, hasUpdatedAt: true, deleteStrategy: 'hardDelete' },
  Journal: { key: 'journal', hasCompanyId: true, hasUpdatedAt: false, deleteStrategy: 'hardDelete' },
  StockAdjustment: { key: 'stockAdjustment', hasCompanyId: true, hasUpdatedAt: false, deleteStrategy: 'hardDelete' },
  // Child tables — scoped by their parent (which carries companyId).
  Batch: { key: 'batch', hasCompanyId: false, hasUpdatedAt: true, deleteStrategy: 'hardDelete', parent: { fk: 'productId', delegateKey: 'product' } },
  SaleItem: { key: 'saleItem', hasCompanyId: false, hasUpdatedAt: false, deleteStrategy: 'hardDelete', parent: { fk: 'saleId', delegateKey: 'sale' } },
  PurchaseItem: { key: 'purchaseItem', hasCompanyId: false, hasUpdatedAt: false, deleteStrategy: 'hardDelete', parent: { fk: 'purchaseId', delegateKey: 'purchase' } },
  SaleReturnItem: { key: 'saleReturnItem', hasCompanyId: false, hasUpdatedAt: false, deleteStrategy: 'hardDelete', parent: { fk: 'returnId', delegateKey: 'saleReturn' } },
  PurchaseReturnItem: { key: 'purchaseReturnItem', hasCompanyId: false, hasUpdatedAt: false, deleteStrategy: 'hardDelete', parent: { fk: 'returnId', delegateKey: 'purchaseReturn' } },
  StockAdjustmentItem: { key: 'stockAdjustmentItem', hasCompanyId: false, hasUpdatedAt: false, deleteStrategy: 'hardDelete', parent: { fk: 'adjustmentId', delegateKey: 'stockAdjustment' } },
  JournalEntry: { key: 'journalEntry', hasCompanyId: false, hasUpdatedAt: false, deleteStrategy: 'hardDelete', parent: { fk: 'journalId', delegateKey: 'journal' } },
};

export interface SyncResult {
  queueId: string;
  status: 'ok' | 'failed';
  error?: string;
}

// ─── Push handler ───────────────────────────────────────────────────────────

export const processSyncQueue = async (
  companyId: string,
  items: any[],
  deviceId = 'unknown',
  appVersion = 'unknown',
) => {
  const results: SyncResult[] = [];
  let successCount = 0;
  let failedCount = 0;

  for (const item of items) {
    const queueId = item.id;
    try {
      // Apply the change and record the audit row atomically, per item, so one bad item
      // does not abort the others and the audit is only written on a successful apply.
      await db.$transaction(async (tx: any) => {
        await applyRecord(tx, item.tableName, item.operation, item.payload || {}, companyId);

        await tx.syncQueue.upsert({
          where: { id: queueId },
          update: {
            tableName: item.tableName,
            recordId: item.recordId,
            operation: item.operation,
            payload: item.payload ?? {},
            isSynced: true,
            syncedAt: new Date(),
            syncError: null,
            deviceId,
            appVersion,
          },
          create: {
            id: queueId,
            companyId,
            deviceId,
            tableName: item.tableName,
            recordId: item.recordId,
            operation: item.operation,
            payload: item.payload ?? {},
            isSynced: true,
            syncedAt: new Date(),
            appVersion,
          },
        });
      });

      results.push({ queueId, status: 'ok' });
      successCount++;
    } catch (err: any) {
      failedCount++;
      results.push({ queueId, status: 'failed', error: err.message });
      logger.error('Sync item failed', { queueId, tableName: item.tableName, error: err.message });

      // Best-effort failure audit (separate write; the apply transaction was rolled back).
      try {
        await db.syncQueue.upsert({
          where: { id: queueId },
          update: {
            tableName: item.tableName,
            recordId: item.recordId,
            operation: item.operation,
            payload: item.payload ?? {},
            isSynced: false,
            syncError: err.message,
            retryCount: { increment: 1 },
            deviceId,
            appVersion,
          },
          create: {
            id: queueId,
            companyId,
            deviceId,
            tableName: item.tableName,
            recordId: item.recordId,
            operation: item.operation,
            payload: item.payload ?? {},
            isSynced: false,
            syncError: err.message,
            appVersion,
          },
        });
      } catch (auditErr: any) {
        logger.error('Failed to write sync failure audit', { queueId, error: auditErr.message });
      }
    }
  }

  return { results, successCount, failedCount };
};

// ─── Apply one record ───────────────────────────────────────────────────────

function stripForUpdate(payload: any, hasCompanyId: boolean) {
  const data = { ...payload };
  delete data.id;
  // Never let a client move a row to another tenant.
  if (hasCompanyId) delete data.companyId;
  return data;
}

async function verifyParent(tx: any, meta: ModelMeta, parentId: any, companyId: string) {
  if (!parentId) throw new Error('Missing parent reference');
  const parent = await tx[meta.parent!.delegateKey].findFirst({
    where: { id: parentId, companyId },
  });
  if (!parent) throw new Error('Parent not found or forbidden');
}

async function applyRecord(
  tx: any,
  tableName: string,
  operation: string,
  payload: any,
  companyId: string,
) {
  const meta = MODELS[tableName];
  if (!meta) throw new Error(`Unknown table: ${tableName}`);

  const delegate = tx[meta.key];
  const id = payload.id;

  if (operation === 'create') {
    if (!id) throw new Error('Missing id for create');

    // Guard against clobbering another tenant's existing row.
    if (meta.hasCompanyId) {
      const existing = await delegate.findUnique({ where: { id } });
      if (existing && existing.companyId !== companyId) {
        throw new Error('Record belongs to another company');
      }
    }
    if (meta.parent) {
      await verifyParent(tx, meta, payload[meta.parent.fk], companyId);
    }

    const createData = meta.hasCompanyId ? { ...payload, companyId } : { ...payload };
    await delegate.upsert({
      where: { id },
      create: createData,
      update: stripForUpdate(payload, meta.hasCompanyId),
    });
    return;
  }

  if (operation === 'update') {
    if (!id) throw new Error('Missing id for update');

    // Optimistic concurrency: don't overwrite newer server data.
    if (meta.hasUpdatedAt && payload.updatedAt) {
      const existing = await delegate.findUnique({ where: { id } });
      if (existing && existing.updatedAt && new Date(existing.updatedAt) > new Date(payload.updatedAt)) {
        return; // server row is newer — skip (reported as ok / no-op)
      }
    }

    const data = stripForUpdate(payload, meta.hasCompanyId);

    if (meta.parent) {
      // Verify the existing child's parent belongs to this company.
      const child = await delegate.findUnique({ where: { id } });
      if (!child) throw new Error('Record not found or forbidden');
      await verifyParent(tx, meta, child[meta.parent.fk], companyId);
      await delegate.update({ where: { id }, data });
      return;
    }

    if (meta.hasCompanyId) {
      const res = await delegate.updateMany({ where: { id, companyId }, data });
      if (res.count === 0) throw new Error('Record not found or forbidden');
      return;
    }

    // Company (no companyId column)
    await delegate.update({ where: { id }, data });
    return;
  }

  if (operation === 'delete') {
    if (!id) throw new Error('Missing id for delete');

    // Child tables: verify parent then hard-delete the child item.
    if (meta.parent) {
      const child = await delegate.findUnique({ where: { id } });
      if (!child) return; // Idempotent: already deleted or never synced
      await verifyParent(tx, meta, child[meta.parent.fk], companyId);
      await delegate.delete({ where: { id } });
      return;
    }

    switch (meta.deleteStrategy) {
      case 'statusInactive': {
        const res = await delegate.updateMany({ where: { id, companyId }, data: { status: 'inactive' } });
        if (res.count === 0) return; // Idempotent
        return;
      }
      case 'txnCancel': {
        const res = await delegate.updateMany({ where: { id, companyId }, data: { status: 'cancelled' } });
        if (res.count === 0) return; // Idempotent
        return;
      }
      case 'hardDelete': {
        const where = meta.hasCompanyId ? { id, companyId } : { id };
        const res = await delegate.deleteMany({ where });
        if (res.count === 0) return; // Idempotent
        return;
      }
      case 'isActiveFalse': {
        const res = await delegate.updateMany({ where: { id, companyId }, data: { isActive: false } });
        if (res.count === 0) return; // Idempotent
        return;
      }
    }
  }

  throw new Error(`Unknown operation: ${operation}`);
}

// ─── Delta pull (changes since) ───────────────────────────────────────────────

export const getChanges = async (companyId: string, since?: Date) => {
  const updatedFilter = since ? { updatedAt: { gte: since } } : {};
  // For child tables that lack updatedAt, filter by their parent's updatedAt.
  const parentUpdated = since ? { updatedAt: { gte: since } } : {};

  // Parents first, children after, so the client can insert in dependency order.
  const companyRecord = await db.company.findFirst({ where: { id: companyId, ...updatedFilter } });
  const companies = companyRecord ? [companyRecord] : [];

  const categories = await db.category.findMany({ where: { companyId, ...updatedFilter } });
  const manufacturers = await db.manufacturer.findMany({ where: { companyId, ...updatedFilter } });
  const racks = await db.rack.findMany({ where: { companyId, ...updatedFilter } });
  const products = await db.product.findMany({ where: { companyId, ...updatedFilter } });
  const customers = await db.customer.findMany({ where: { companyId, ...updatedFilter } });
  const suppliers = await db.supplier.findMany({ where: { companyId, ...updatedFilter } });
  const batches = await db.batch.findMany({ where: { product: { companyId }, ...updatedFilter } });
  const sales = await db.sale.findMany({ where: { companyId, ...updatedFilter } });
  const saleItems = await db.saleItem.findMany({ where: { sale: { companyId, ...parentUpdated } } });
  const purchases = await db.purchase.findMany({ where: { companyId, ...updatedFilter } });
  const purchaseItems = await db.purchaseItem.findMany({ where: { purchase: { companyId, ...parentUpdated } } });
  const receipts = await db.receipt.findMany({ where: { companyId, ...updatedFilter } });
  const payments = await db.payment.findMany({ where: { companyId, ...updatedFilter } });

  const purchaseReturns = await db.purchaseReturn.findMany({ where: { companyId, ...updatedFilter } });
  const purchaseReturnItems = await db.purchaseReturnItem.findMany({ where: { purchaseReturn: { companyId, ...parentUpdated } } });
  const saleReturns = await db.saleReturn.findMany({ where: { companyId, ...updatedFilter } });
  const saleReturnItems = await db.saleReturnItem.findMany({ where: { saleReturn: { companyId, ...parentUpdated } } });
  const stockAdjustments = await db.stockAdjustment.findMany({ where: { companyId, ...updatedFilter } });
  const stockAdjustmentItems = await db.stockAdjustmentItem.findMany({ where: { adjustment: { companyId, ...parentUpdated } } });
  const journals = await db.journal.findMany({ where: { companyId, ...updatedFilter } });
  const journalEntries = await db.journalEntry.findMany({ where: { journal: { companyId, ...parentUpdated } } });

  return {
    companies,
    categories,
    manufacturers,
    racks,
    products,
    customers,
    suppliers,
    batches,
    sales,
    saleItems,
    purchases,
    purchaseItems,
    receipts,
    payments,
    purchaseReturns,
    purchaseReturnItems,
    saleReturns,
    saleReturnItems,
    stockAdjustments,
    stockAdjustmentItems,
    journals,
    journalEntries,
  };
};
