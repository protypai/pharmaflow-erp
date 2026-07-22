import { db } from '../config/database';
import { generateCode } from '../utils/codeGenerator';
import { AppError } from '../utils/AppError';

export class SalesService {
  async createSale(companyId: string, data: any) {
    const invoiceNo = data.invoiceNo || await generateCode('SAL', 'product');

    return db.$transaction(async (tx: any) => {
      // Validate batch stock before selling
      for (const item of data.items) {
        const batch = await tx.batch.findUnique({ where: { id: item.batchId } });
        if (!batch || batch.currentQty < item.qty) {
          throw new AppError(`Insufficient stock for batch ${batch?.batchNo || item.batchId}`, 400);
        }
      }

      const sale = await tx.sale.create({
        data: {
          companyId,
          invoiceNo,
          customerId: data.customerId,
          date: new Date(data.date),
          salesman: data.salesman,
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
              mrp: item.mrp,
              ptr: item.ptr,
              salePrice: item.salePrice,
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

      // Deduct stock from batches
      for (const item of data.items) {
        await tx.batch.update({
          where: { id: item.batchId },
          data: { currentQty: { decrement: item.qty } }
        });
      }

      return sale;
    });
  }

  async listSales(companyId: string, filters: { customerId?: string; startDate?: Date; endDate?: Date }) {
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
        items: { include: { product: { select: { name: true } } } }
      },
      orderBy: { date: 'desc' }
    });
  }

  async getSaleById(id: string) {
    return db.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: true, batch: true } }
      }
    });
  }
}

export const salesService = new SalesService();
