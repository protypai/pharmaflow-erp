import { db } from '../config/database';
import { generateCode } from '../utils/codeGenerator';
import { AppError } from '../utils/AppError';
import { computeLine, computeHeader, GstType } from '../utils/taxCalculator';

function isIgstLine(item: any): boolean {
  return item.isIgst === true || (Number(item.igst) > 0 && !(Number(item.cgst) > 0));
}

export class SalesService {
  async createSale(companyId: string, data: any) {
    const gstType: GstType = data.gstType === 'inclusive' ? 'inclusive' : 'exclusive';

    return db.$transaction(async (tx: any) => {
      // Generate invoice number inside the transaction, per-company (safe under concurrency).
      const invoiceNo = data.invoiceNo || (await generateCode(companyId, 'sale', tx));

      // Validate stock: free goods are also dispensed, so guard against qty + freeQty.
      const computedItems = [];
      for (const item of data.items) {
        const freeQty = Number(item.freeQty) || 0;
        const qty = Number(item.qty) || 0;
        const totalOut = qty + freeQty;

        const batch = await tx.batch.findUnique({ where: { id: item.batchId } });
        if (!batch) {
          throw new AppError(`Batch not found: ${item.batchId}`, 400);
        }
        if (batch.currentQty < totalOut) {
          throw new AppError(`Insufficient stock for batch ${batch.batchNo || item.batchId}`, 400);
        }

        // Recompute taxable / tax / net server-side (never trust client totals).
        const computed = computeLine(
          {
            qty,
            unitPrice: Number(item.salePrice) || 0,
            discPercent: item.discPercent,
            discAmount: item.discAmount,
            gstRate: Number(item.gstRate) || 0,
            isIgst: isIgstLine(item),
          },
          gstType,
        );

        computedItems.push({ item, qty, freeQty, computed });
      }

      const header = computeHeader(
        computedItems.map((ci) => ({
          qty: ci.qty,
          unitPrice: Number(ci.item.salePrice) || 0,
          computed: ci.computed,
        })),
        Number(data.roundOff) || 0,
      );

      const sale = await tx.sale.create({
        data: {
          companyId,
          invoiceNo,
          customerId: data.customerId,
          date: new Date(data.date),
          salesman: data.salesman,
          gstType,
          subtotal: header.subtotal,
          discountAmount: header.discountAmount,
          taxableAmount: header.taxableAmount,
          cgstAmount: header.cgstAmount,
          sgstAmount: header.sgstAmount,
          igstAmount: header.igstAmount,
          netAmount: header.netAmount,
          roundOff: Number(data.roundOff) || 0,
          paymentMode: data.paymentMode || 'credit',
          paidAmount: Number(data.paidAmount) || 0,
          notes: data.notes,
          items: {
            create: computedItems.map(({ item, qty, freeQty, computed }) => ({
              productId: item.productId,
              batchId: item.batchId,
              qty,
              freeQty,
              mrp: Number(item.mrp) || 0,
              ptr: Number(item.ptr) || 0,
              salePrice: Number(item.salePrice) || 0,
              discPercent: Number(item.discPercent) || 0,
              discAmount: computed.discAmount,
              gstRate: computed.gstRate,
              cgst: computed.cgst,
              sgst: computed.sgst,
              igst: computed.igst,
              taxableAmt: computed.taxableAmt,
              netAmount: computed.netAmount,
            })),
          },
        },
        include: { items: true },
      });

      // Deduct batch stock by qty + freeQty so dispensed free goods leave inventory.
      for (const { item, qty, freeQty } of computedItems) {
        await tx.batch.update({
          where: { id: item.batchId },
          data: { currentQty: { decrement: qty + freeQty } },
        });
      }

      return sale;
    });
  }

  async listSales(
    companyId: string,
    filters: { customerId?: string; startDate?: Date; endDate?: Date },
  ) {
    const where: any = { companyId };
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    return db.sale.findMany({
      where,
      include: {
        customer: { select: { name: true, gstin: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getSaleById(companyId: string, id: string) {
    return db.sale.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        items: { include: { product: true, batch: true } },
      },
    });
  }
}

export const salesService = new SalesService();
