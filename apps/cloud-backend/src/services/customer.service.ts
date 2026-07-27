import { db } from '../config/database';
import { generateCode } from '../utils/codeGenerator';
import { AppError } from '../utils/AppError';

function buildCustomerData(data: any) {
  const out: any = {};
  const fields = [
    'name', 'type', 'gstin', 'drugLicense', 'phone', 'email', 'address', 'area',
    'city', 'state', 'pincode', 'salesman', 'creditLimit', 'creditDays',
    'openingBalance', 'openingBalanceType', 'status',
  ];
  for (const f of fields) {
    if (data[f] !== undefined) out[f] = data[f];
  }
  return out;
}

export class CustomerService {
  async createCustomer(companyId: string, data: any) {
    return db.$transaction(async (tx: any) => {
      const code = data.code || (await generateCode(companyId, 'customer', tx));
      return tx.customer.create({
        data: {
          ...buildCustomerData(data),
          companyId,
          code,
        },
      });
    });
  }

  async updateCustomer(companyId: string, id: string, data: any) {
    const existing = await db.customer.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Customer not found', 404);

    return db.customer.update({
      where: { id },
      data: buildCustomerData(data),
    });
  }

  async listCustomers(companyId: string, filters: { search?: string; type?: string }) {
    const where: any = { companyId };
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { gstin: { contains: filters.search } },
      ];
    }
    if (filters.type) where.type = filters.type;

    return db.customer.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async getCustomerById(companyId: string, id: string) {
    const customer = await db.customer.findFirst({
      where: { id, companyId },
      include: {
        sales: { select: { netAmount: true, paidAmount: true } },
        receipts: { select: { amount: true } },
        salesReturns: { select: { netAmount: true } },
      },
    });

    if (!customer) return null;

    const totalSales = customer.sales.reduce((sum: number, s: any) => sum + s.netAmount, 0);
    const totalReceipts = customer.receipts.reduce((sum: number, r: any) => sum + r.amount, 0);
    const totalReturns = customer.salesReturns.reduce((sum: number, sr: any) => sum + sr.netAmount, 0);
    const currentOutstanding = customer.openingBalance + totalSales - totalReceipts - totalReturns;

    return {
      ...customer,
      totalSales,
      totalReceipts,
      totalReturns,
      currentOutstanding,
    };
  }
}

export const customerService = new CustomerService();
