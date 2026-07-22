import { db } from '../config/database';
import { generateCode } from '../utils/codeGenerator';

export class ReturnService {
  async createPurchaseReturn(companyId: string, data: any) {
    const entryNo = data.entryNo || await generateCode('PRN', 'product');

    return db.$transaction(async (tx: any) => {
      const purchaseReturn = await tx.purchaseReturn.create({
        data: {
          companyId,
          entryNo,
          purchaseId: data.purchaseId,
          supplierId: data.supplierId,
          returnDate: new Date(data.returnDate),
          reason: data.reason,
          debitNoteNo: data.debitNoteNo,
          netAmount: data.netAmount,
          items: {
            create: data.items.map((item: any) => ({
              productId: item.productId,
              batchId: item.batchId,
              qty: item.qty,
              mrp: item.mrp,
              ptr: item.ptr,
              netAmount: item.netAmount,
              reason: item.reason || 'near_expiry'
            }))
          }
        },
        include: { items: true }
      });

      // Decrement stock for purchase return
      for (const item of data.items) {
        await tx.batch.update({
          where: { id: item.batchId },
          data: { currentQty: { decrement: item.qty } }
        });
      }

      return purchaseReturn;
    });
  }

  async createSaleReturn(companyId: string, data: any) {
    const entryNo = data.entryNo || await generateCode('SRN', 'product');

    return db.$transaction(async (tx: any) => {
      const saleReturn = await tx.saleReturn.create({
        data: {
          companyId,
          entryNo,
          saleId: data.saleId,
          customerId: data.customerId,
          returnDate: new Date(data.returnDate),
          reason: data.reason,
          creditNoteNo: data.creditNoteNo,
          netAmount: data.netAmount,
          items: {
            create: data.items.map((item: any) => ({
              productId: item.productId,
              batchId: item.batchId,
              qty: item.qty,
              mrp: item.mrp,
              salePrice: item.salePrice,
              netAmount: item.netAmount,
              reason: item.reason || 'near_expiry'
            }))
          }
        },
        include: { items: true }
      });

      // Restore stock for sales return
      for (const item of data.items) {
        await tx.batch.update({
          where: { id: item.batchId },
          data: { currentQty: { increment: item.qty } }
        });
      }

      return saleReturn;
    });
  }

  async listPurchaseReturns(companyId: string) {
    return db.purchaseReturn.findMany({
      where: { companyId },
      include: { supplier: { select: { name: true } }, items: true },
      orderBy: { returnDate: 'desc' }
    });
  }

  async listSaleReturns(companyId: string) {
    return db.saleReturn.findMany({
      where: { companyId },
      include: { customer: { select: { name: true } }, items: true },
      orderBy: { returnDate: 'desc' }
    });
  }
}

export const returnService = new ReturnService();
