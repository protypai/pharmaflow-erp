import { db } from '../config/database';
import { generateCode } from '../utils/codeGenerator';
import { AppError } from '../utils/AppError';

export class StockAdjustmentService {
  async createStockAdjustment(companyId: string, data: any) {
    return db.$transaction(async (tx: any) => {
      const entryNo = data.entryNo || (await generateCode(companyId, 'stockAdjustment', tx));

      const adjustment = await tx.stockAdjustment.create({
        data: {
          companyId,
          entryNo,
          date: new Date(data.date),
          reason: data.reason,
          notes: data.notes,
          items: {
            create: data.items.map((item: any) => ({
              productId: item.productId,
              batchId: item.batchId,
              systemQty: Number(item.systemQty) || 0,
              physicalQty: Number(item.physicalQty) || 0,
              differenceQty: Number(item.differenceQty) || 0,
              reason: item.reason || data.reason,
            })),
          },
        },
        include: { items: true },
      });

      // Apply the difference to batch stock (increment or decrement), with a negative guard.
      for (const item of data.items) {
        const difference = Number(item.differenceQty) || 0;

        // Tenant guard: batch must belong to a product in the caller's company.
        const batch = await tx.batch.findFirst({
          where: { id: item.batchId, product: { companyId } },
        });
        if (!batch) {
          throw new AppError(`Batch not found: ${item.batchId}`, 400);
        }
        if (batch.currentQty + difference < 0) {
          throw new AppError(
            `Adjustment would make stock negative for batch ${batch.batchNo || item.batchId}`,
            400,
          );
        }
        await tx.batch.update({
          where: { id: item.batchId },
          data: { currentQty: { increment: difference } },
        });
      }

      return adjustment;
    });
  }

  async listStockAdjustments(companyId: string) {
    return db.stockAdjustment.findMany({
      where: { companyId },
      include: {
        items: { include: { batch: true } },
      },
      orderBy: { date: 'desc' },
    });
  }
}

export const stockAdjustmentService = new StockAdjustmentService();
