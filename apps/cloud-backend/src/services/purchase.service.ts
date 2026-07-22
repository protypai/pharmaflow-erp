import { db } from '../config/database';
import { generateCode } from '../utils/codeGenerator';

export class PurchaseService {
  async createPurchase(companyId: string, data: any) {
    const entryNo = data.entryNo || await generateCode('PUR', 'product');

    return db.$transaction(async (tx: any) => {
      const purchase = await tx.purchase.create({
        data: {
          companyId,
          entryNo,
          supplierId: data.supplierId,
          invoiceNo: data.invoiceNo,
          invoiceDate: new Date(data.invoiceDate),
          gstType: data.gstType || 'exclusive',
          subtotal: data.subtotal,
          discountAmount: data.discountAmount || 0,
          taxableAmount: data.taxableAmount,
          cgstAmount: data.cgstAmount || 0,
          sgstAmount: data.sgstAmount || 0,
          igstAmount: data.igstAmount || 0,
          netAmount: data.netAmount,
          roundOff: data.roundOff || 0,
          paymentMode: data.paymentMode || 'credit',
          paidAmount: data.paidAmount || 0,
          notes: data.notes,
          items: {
            create: data.items.map((item: any) => ({
              productId: item.productId,
              batchId: item.batchId,
              qty: item.qty,
              freeQty: item.freeQty || 0,
              purchasePrice: item.purchasePrice,
              ptr: item.ptr,
              mrp: item.mrp,
              discPercent: item.discPercent || 0,
              discAmount: item.discAmount || 0,
              gstRate: item.gstRate,
              cgst: item.cgst || 0,
              sgst: item.sgst || 0,
              igst: item.igst || 0,
              taxableAmt: item.taxableAmt,
              netAmount: item.netAmount
            }))
          }
        },
        include: { items: true }
      });

      // Increment batch currentQty for each line item
      for (const item of data.items) {
        await tx.batch.update({
          where: { id: item.batchId },
          data: { currentQty: { increment: item.qty + (item.freeQty || 0) } }
        });
      }

      return purchase;
    });
  }

  async listPurchases(companyId: string, filters: { supplierId?: string; startDate?: Date; endDate?: Date }) {
    const where: any = { companyId };
    if (filters.supplierId) where.supplierId = filters.supplierId;
    if (filters.startDate || filters.endDate) {
      where.invoiceDate = {};
      if (filters.startDate) where.invoiceDate.gte = filters.startDate;
      if (filters.endDate) where.invoiceDate.lte = filters.endDate;
    }

    return db.purchase.findMany({
      where,
      include: {
        supplier: { select: { name: true, gstin: true } },
        items: { include: { product: { select: { name: true } } } }
      },
      orderBy: { invoiceDate: 'desc' }
    });
  }

  async getPurchaseById(id: string) {
    return db.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { product: true, batch: true } }
      }
    });
  }
}

export const purchaseService = new PurchaseService();
