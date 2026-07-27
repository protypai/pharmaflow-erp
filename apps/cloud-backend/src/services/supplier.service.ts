import { db } from '../config/database';
import { generateCode } from '../utils/codeGenerator';
import { AppError } from '../utils/AppError';

function buildSupplierData(data: any) {
  const out: any = {};
  const fields = [
    'name', 'gstin', 'drugLicense', 'phone', 'email', 'address', 'city', 'state',
    'pincode', 'creditDays', 'creditLimit', 'openingBalance', 'openingBalanceType', 'status',
  ];
  for (const f of fields) {
    if (data[f] !== undefined) out[f] = data[f];
  }
  return out;
}

export class SupplierService {
  async createSupplier(companyId: string, data: any) {
    return db.$transaction(async (tx: any) => {
      const code = data.code || (await generateCode(companyId, 'supplier', tx));
      return tx.supplier.create({
        data: {
          ...buildSupplierData(data),
          companyId,
          code,
        },
      });
    });
  }

  async updateSupplier(companyId: string, id: string, data: any) {
    const existing = await db.supplier.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Supplier not found', 404);

    return db.supplier.update({
      where: { id },
      data: buildSupplierData(data),
    });
  }

  async listSuppliers(companyId: string, filters: { search?: string }) {
    const where: any = { companyId };
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { gstin: { contains: filters.search } },
      ];
    }

    return db.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async getSupplierById(companyId: string, id: string) {
    const supplier = await db.supplier.findFirst({
      where: { id, companyId },
      include: {
        purchases: { select: { netAmount: true, paidAmount: true } },
        payments: { select: { amount: true } },
        purchaseReturns: { select: { netAmount: true } },
      },
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
      currentPayable,
    };
  }
}

export const supplierService = new SupplierService();
