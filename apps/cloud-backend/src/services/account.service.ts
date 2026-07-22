import { db } from '../config/database';

export class AccountService {
  async createReceipt(companyId: string, data: any) {
    return db.$transaction(async (tx: any) => {
      const receipt = await tx.receipt.create({
        data: {
          ...data,
          companyId
        }
      });
      return receipt;
    });
  }

  async createPayment(companyId: string, data: any) {
    return db.$transaction(async (tx: any) => {
      const payment = await tx.payment.create({
        data: {
          ...data,
          companyId
        }
      });
      return payment;
    });
  }

  async createJournal(companyId: string, data: { entryNo: string; date: Date; narration: string; debitAmt: number; creditAmt: number; entries: any[] }) {
    return db.journal.create({
      data: {
        companyId,
        entryNo: data.entryNo,
        date: data.date,
        narration: data.narration,
        debitAmt: data.debitAmt,
        creditAmt: data.creditAmt,
        entries: {
          create: data.entries
        }
      },
      include: { entries: true }
    });
  }

  async getCustomerLedger(companyId: string, customerId: string, startDate?: Date, endDate?: Date) {
    const whereDate: any = {};
    if (startDate) whereDate.gte = startDate;
    if (endDate) whereDate.lte = endDate;

    const sales = await db.sale.findMany({
      where: { companyId, customerId, ...(startDate || endDate ? { date: whereDate } : {}) },
      select: { date: true, invoiceNo: true, netAmount: true, notes: true }
    });

    const receipts = await db.receipt.findMany({
      where: { companyId, customerId, ...(startDate || endDate ? { date: whereDate } : {}) },
      select: { date: true, receiptNo: true, amount: true, paymentMode: true, notes: true }
    });

    const entries = [
      ...sales.map((sale: any) => ({
        date: sale.date,
        type: 'SALE',
        refNo: sale.invoiceNo,
        debit: sale.netAmount,
        credit: 0,
        notes: sale.notes
      })),
      ...receipts.map((receipt: any) => ({
        date: receipt.date,
        type: 'RECEIPT',
        refNo: receipt.receiptNo,
        debit: 0,
        credit: receipt.amount,
        notes: `${receipt.paymentMode} ${receipt.notes || ''}`
      }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    return entries.map((e: any) => {
      runningBalance += e.debit - e.credit;
      return { ...e, runningBalance };
    });
  }

  async getSupplierLedger(companyId: string, supplierId: string, startDate?: Date, endDate?: Date) {
    const whereDate: any = {};
    if (startDate) whereDate.gte = startDate;
    if (endDate) whereDate.lte = endDate;

    const purchases = await db.purchase.findMany({
      where: { companyId, supplierId, ...(startDate || endDate ? { invoiceDate: whereDate } : {}) },
      select: { invoiceDate: true, entryNo: true, invoiceNo: true, netAmount: true, notes: true }
    });

    const payments = await db.payment.findMany({
      where: { companyId, supplierId, ...(startDate || endDate ? { date: whereDate } : {}) },
      select: { date: true, paymentNo: true, amount: true, paymentMode: true, notes: true }
    });

    const entries = [
      ...purchases.map((purchase: any) => ({
        date: purchase.invoiceDate,
        type: 'PURCHASE',
        refNo: `${purchase.entryNo} (${purchase.invoiceNo})`,
        debit: 0,
        credit: purchase.netAmount,
        notes: purchase.notes
      })),
      ...payments.map((payment: any) => ({
        date: payment.date,
        type: 'PAYMENT',
        refNo: payment.paymentNo,
        debit: payment.amount,
        credit: 0,
        notes: `${payment.paymentMode} ${payment.notes || ''}`
      }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    return entries.map((e: any) => {
      runningBalance += e.credit - e.debit;
      return { ...e, runningBalance };
    });
  }
}

export const accountService = new AccountService();
