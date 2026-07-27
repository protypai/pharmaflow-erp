import { db } from '../config/database';
import { generateCode } from '../utils/codeGenerator';
import { AppError } from '../utils/AppError';

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export class ReturnService {
  async createPurchaseReturn(companyId: string, data: any) {
    return db.$transaction(async (tx: any) => {
      const entryNo = data.entryNo || (await generateCode(companyId, 'purchaseReturn', tx));

      // Server-computed header total from line items (do not trust client netAmount).
      const netAmount = round2(
        data.items.reduce((sum: number, it: any) => sum + (Number(it.netAmount) || 0), 0),
      );

      const purchaseReturn = await tx.purchaseReturn.create({
        data: {
          companyId,
          entryNo,
          purchaseId: data.purchaseId,
          supplierId: data.supplierId,
          returnDate: new Date(data.returnDate),
          reason: data.reason,
          debitNoteNo: data.debitNoteNo,
          netAmount,
          items: {
            create: data.items.map((item: any) => ({
              productId: item.productId,
              batchId: item.batchId,
              qty: Number(item.qty) || 0,
              mrp: Number(item.mrp) || 0,
              ptr: Number(item.ptr) || 0,
              netAmount: Number(item.netAmount) || 0,
              reason: item.reason || 'near_expiry',
            })),
          },
        },
        include: { items: true },
      });

      // Purchase return removes goods from stock: guard against going negative.
      for (const item of data.items) {
        const qty = Number(item.qty) || 0;
        const batch = await tx.batch.findUnique({ where: { id: item.batchId } });
        if (!batch) {
          throw new AppError(`Batch not found: ${item.batchId}`, 400);
        }
        if (batch.currentQty < qty) {
          throw new AppError(
            `Cannot return more than current stock for batch ${batch.batchNo || item.batchId}`,
            400,
          );
        }
        await tx.batch.update({
          where: { id: item.batchId },
          data: { currentQty: { decrement: qty } },
        });
      }

      return purchaseReturn;
    });
  }

  async createSaleReturn(companyId: string, data: any) {
    return db.$transaction(async (tx: any) => {
      const entryNo = data.entryNo || (await generateCode(companyId, 'saleReturn', tx));

      const netAmount = round2(
        data.items.reduce((sum: number, it: any) => sum + (Number(it.netAmount) || 0), 0),
      );

      const saleReturn = await tx.saleReturn.create({
        data: {
          companyId,
          entryNo,
          saleId: data.saleId,
          customerId: data.customerId,
          returnDate: new Date(data.returnDate),
          reason: data.reason,
          creditNoteNo: data.creditNoteNo,
          netAmount,
          items: {
            create: data.items.map((item: any) => ({
              productId: item.productId,
              batchId: item.batchId,
              qty: Number(item.qty) || 0,
              mrp: Number(item.mrp) || 0,
              salePrice: Number(item.salePrice) || 0,
              netAmount: Number(item.netAmount) || 0,
              reason: item.reason || 'near_expiry',
            })),
          },
        },
        include: { items: true },
      });

      // Sale return brings goods back into stock: increment currentQty.
      for (const item of data.items) {
        const qty = Number(item.qty) || 0;
        const batch = await tx.batch.findUnique({ where: { id: item.batchId } });
        if (!batch) {
          throw new AppError(`Batch not found: ${item.batchId}`, 400);
        }
        await tx.batch.update({
          where: { id: item.batchId },
          data: { currentQty: { increment: qty } },
        });
      }

      return saleReturn;
    });
  }

  async listPurchaseReturns(companyId: string) {
    return db.purchaseReturn.findMany({
      where: { companyId },
      include: { supplier: { select: { name: true } }, items: true },
      orderBy: { returnDate: 'desc' },
    });
  }

  async listSaleReturns(companyId: string) {
    return db.saleReturn.findMany({
      where: { companyId },
      include: { customer: { select: { name: true } }, items: true },
      orderBy: { returnDate: 'desc' },
    });
  }
}

export const returnService = new ReturnService();
