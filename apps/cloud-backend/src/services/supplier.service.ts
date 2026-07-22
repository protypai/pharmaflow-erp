import { db } from '../config/database';
import { generateCode } from '../utils/codeGenerator';

export class SupplierService {
  async createSupplier(companyId: string, data: any) {
    const code = data.code || await generateCode('SUP', 'supplier');
    return db.supplier.create({
      data: {
        ...data,
        companyId,
        code
      }
    });
  }

  async updateSupplier(id: string, data: any) {
    return db.supplier.update({
      where: { id },
      data
    });
  }

  async listSuppliers(companyId: string, filters: { search?: string }) {
    const where: any = { companyId };
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { gstin: { contains: filters.search } }
      ];
    }

    return db.supplier.findMany({
      where,
      orderBy: { name: 'asc' }
    });
  }

  async getSupplierById(id: string) {
    const supplier = await db.supplier.findUnique({
      where: { id },
      include: {
        purchases: { select: { netAmount: true, paidAmount: true } },
        payments: { select: { amount: true } },
        purchaseReturns: { select: { netAmount: true } }
      }
    });

    if (!supplier) return null;

    const totalPurchases = supplier.purchases.reduce((sum: number, p: any) => sum + p.netAmount, 0);
    const totalPayments = supplier.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const totalReturns = supplier.purchaseReturns.reduce((sum: number, pr: any) => sum + pr.netAmount, 0);
    const currentPayable = supplier.openingBalance + totalPurchases - totalPayments - totalReturns;

    return {
      ...supplier,
      totalPurchases,
      totalPayments,
      totalReturns,
      currentPayable
    };
  }
}

export const supplierService = new SupplierService();
