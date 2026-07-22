import { db } from '../config/database';

export class ReportService {
  async getSalesReport(companyId: string, startDate?: Date, endDate?: Date) {
    const where: any = { companyId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const sales = await db.sale.findMany({
      where,
      include: {
        customer: { select: { name: true, gstin: true } }
      },
      orderBy: { date: 'desc' }
    });

    const summary = sales.reduce((acc: any, sale: any) => {
      acc.totalSales += sale.netAmount;
      acc.totalTaxable += sale.taxableAmount;
      acc.totalGst += sale.cgstAmount + sale.sgstAmount + sale.igstAmount;
      acc.totalInvoices += 1;
      return acc;
    }, { totalSales: 0, totalTaxable: 0, totalGst: 0, totalInvoices: 0 });

    return { summary, sales };
  }

  async getPurchaseReport(companyId: string, startDate?: Date, endDate?: Date) {
    const where: any = { companyId };
    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = startDate;
      if (endDate) where.invoiceDate.lte = endDate;
    }

    const purchases = await db.purchase.findMany({
      where,
      include: {
        supplier: { select: { name: true, gstin: true } }
      },
      orderBy: { invoiceDate: 'desc' }
    });

    const summary = purchases.reduce((acc: any, purchase: any) => {
      acc.totalPurchases += purchase.netAmount;
      acc.totalTaxable += purchase.taxableAmount;
      acc.totalGst += purchase.cgstAmount + purchase.sgstAmount + purchase.igstAmount;
      acc.totalInvoices += 1;
      return acc;
    }, { totalPurchases: 0, totalTaxable: 0, totalGst: 0, totalInvoices: 0 });

    return { summary, purchases };
  }

  async getStockReport(companyId: string) {
    const products = await db.product.findMany({
      where: { companyId, status: 'active' },
      include: {
        category: true,
        batches: true
      }
    });

    let totalValuation = 0;
    let lowStockCount = 0;
    let expiredBatchCount = 0;
    const now = new Date();

    const reportItems = products.map((product: any) => {
      const currentStock = product.batches.reduce((sum: number, batch: any) => {
        if (batch.expiryDate < now) expiredBatchCount++;
        return sum + batch.currentQty;
      }, 0);

      const itemValuation = product.batches.reduce((sum: number, batch: any) => {
        return sum + (batch.currentQty * batch.purchasePrice);
      }, 0);

      totalValuation += itemValuation;
      if (currentStock <= product.minStock) lowStockCount++;

      return {
        id: product.id,
        code: product.code,
        name: product.name,
        category: product.category?.name || '-',
        currentStock,
        minStock: product.minStock,
        itemValuation,
        batchesCount: product.batches.length
      };
    });

    return {
      summary: {
        totalProducts: products.length,
        totalValuation,
        lowStockCount,
        expiredBatchCount
      },
      items: reportItems
    };
  }

  async getGstReport(companyId: string, startDate?: Date, endDate?: Date) {
    const where: any = { companyId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const sales = await db.sale.findMany({
      where,
      include: { customer: true, items: true }
    });

    const b2bSales = sales.filter((sale: any) => sale.customer?.gstin && sale.customer.gstin.trim().length > 0);
    const b2cSales = sales.filter((sale: any) => !sale.customer?.gstin || sale.customer.gstin.trim().length === 0);

    const totalCgst = sales.reduce((sum: number, s: any) => sum + s.cgstAmount, 0);
    const totalSgst = sales.reduce((sum: number, s: any) => sum + s.sgstAmount, 0);
    const totalIgst = sales.reduce((sum: number, s: any) => sum + s.igstAmount, 0);

    return {
      summary: {
        totalTaxable: sales.reduce((sum: number, s: any) => sum + s.taxableAmount, 0),
        totalCgst,
        totalSgst,
        totalIgst,
        totalTax: totalCgst + totalSgst + totalIgst
      },
      b2bSales,
      b2cSales
    };
  }
}

export const reportService = new ReportService();
