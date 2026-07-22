import { db } from '../config/database';
import { generateCode } from '../utils/codeGenerator';

export class CustomerService {
  async createCustomer(companyId: string, data: any) {
    const code = data.code || await generateCode('CUST', 'customer');
    return db.customer.create({
      data: {
        ...data,
        companyId,
        code
      }
    });
  }

  async updateCustomer(id: string, data: any) {
    return db.customer.update({
      where: { id },
      data
    });
  }

  async listCustomers(companyId: string, filters: { search?: string; type?: string }) {
    const where: any = { companyId };
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { gstin: { contains: filters.search } }
      ];
    }
    if (filters.type) where.type = filters.type;

    return db.customer.findMany({
      where,
      orderBy: { name: 'asc' }
    });
  }

  async getCustomerById(id: string) {
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        sales: { select: { netAmount: true, paidAmount: true } },
        receipts: { select: { amount: true } },
        salesReturns: { select: { netAmount: true } }
      }
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
      currentOutstanding
    };
  }
}

export const customerService = new CustomerService();
