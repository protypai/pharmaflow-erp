import { db } from '../config/database';
import { generateCode } from '../utils/codeGenerator';
import { AppError } from '../utils/AppError';
import { computeLine, computeHeader, GstType } from '../utils/taxCalculator';

function isIgstLine(item: any): boolean {
  return item.isIgst === true || (Number(item.igst) > 0 && !(Number(item.cgst) > 0));
}

export class PurchaseService {
  async createPurchase(companyId: string, data: any) {
    const gstType: GstType = data.gstType === 'inclusive' ? 'inclusive' : 'exclusive';

    return db.$transaction(async (tx: any) => {
      const entryNo = data.entryNo || (await generateCode(companyId, 'purchase', tx));

      // Resolve/create the batch for every line BEFORE creating the purchase, and remember how
      // much stock to add. New batches are created with their opening qty, existing ones are
      // incremented afterwards.
      const resolvedItems = [];
      for (const item of data.items) {
        const qty = Number(item.qty) || 0;
        const freeQty = Number(item.freeQty) || 0;
        const incoming = qty + freeQty;

        // Tenant guard: the product must belong to the caller's company.
        const product = await tx.product.findFirst({
          where: { id: item.productId, companyId },
        });
        if (!product) {
          throw new AppError(`Product not found: ${item.productId}`, 400);
        }

        let batchId: string | null = null;
        let createdNewBatch = false;

        if (item.batchId) {
          const existing = await tx.batch.findUnique({ where: { id: item.batchId } });
          if (existing && existing.productId === item.productId) {
            batchId = existing.id;
          }
        }

        if (!batchId && item.batchNo) {
          const existing = await tx.batch.findFirst({
            where: { productId: item.productId, batchNo: item.batchNo },
          });
          if (existing) batchId = existing.id;
        }

        if (!batchId) {
          // Create a brand-new batch for this product with its opening quantity.
          if (!item.batchNo) {
            throw new AppError('batchNo is required to create a new batch', 400);
          }
          const created = await tx.batch.create({
            data: {
              productId: item.productId,
              batchNo: item.batchNo,
              expiryDate: item.expiryDate ? new Date(item.expiryDate) : new Date(),
              mrp: Number(item.mrp) || 0,
              ptr: Number(item.ptr) || 0,
              pts: item.pts != null ? Number(item.pts) : null,
              purchasePrice: Number(item.purchasePrice) || 0,
              gstRate: Number(item.gstRate) || 0,
              currentQty: incoming,
              freeQty,
            },
          });
          batchId = created.id;
          createdNewBatch = true;
        }

        const computed = computeLine(
          {
            qty,
            unitPrice: Number(item.purchasePrice) || 0,
            discPercent: item.discPercent,
            discAmount: item.discAmount,
            gstRate: Number(item.gstRate) || 0,
            isIgst: isIgstLine(item),
          },
          gstType,
        );

        resolvedItems.push({ item, qty, freeQty, incoming, batchId, createdNewBatch, computed });
      }

      const header = computeHeader(
        resolvedItems.map((ri) => ({
          qty: ri.qty,
          unitPrice: Number(ri.item.purchasePrice) || 0,
          computed: ri.computed,
        })),
        Number(data.roundOff) || 0,
      );

      const purchase = await tx.purchase.create({
        data: {
          companyId,
          entryNo,
          supplierId: data.supplierId,
          invoiceNo: data.invoiceNo,
          invoiceDate: new Date(data.invoiceDate),
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
            create: resolvedItems.map(({ item, qty, freeQty, batchId, computed }) => ({
              productId: item.productId,
              batchId: batchId as string,
              qty,
              freeQty,
              purchasePrice: Number(item.purchasePrice) || 0,
              ptr: Number(item.ptr) || 0,
              mrp: Number(item.mrp) || 0,
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

      // Increment stock only for pre-existing batches (new batches already opened with their qty).
      for (const { batchId, incoming, createdNewBatch } of resolvedItems) {
        if (createdNewBatch) continue;
        await tx.batch.update({
          where: { id: batchId as string },
          data: { currentQty: { increment: incoming } },
        });
      }

      return purchase;
    });
  }

  async listPurchases(
    companyId: string,
    filters: { supplierId?: string; startDate?: Date; endDate?: Date },
  ) {
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
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { invoiceDate: 'desc' },
    });
  }

  async getPurchaseById(companyId: string, id: string) {
    return db.purchase.findFirst({
      where: { id, companyId },
      include: {
        supplier: true,
        items: { include: { product: true, batch: true } },
      },
    });
  }
}

export const purchaseService = new PurchaseService();
