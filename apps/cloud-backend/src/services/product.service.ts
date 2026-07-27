import { db } from '../config/database';
import { generateCode } from '../utils/codeGenerator';
import { AppError } from '../utils/AppError';

// Whitelisted, writable Product fields (prevents mass-assignment of companyId/id/etc.)
function buildProductData(data: any) {
  const out: any = {};
  const fields = [
    'barcode', 'name', 'genericName', 'manufacturerId', 'categoryId', 'rackId',
    'packing', 'purchaseUnit', 'saleUnit', 'conversionFactor', 'hsnCode', 'gstRate',
    'schedule', 'minStock', 'maxStock', 'reorderQty', 'discontinued', 'status',
  ];
  for (const f of fields) {
    if (data[f] !== undefined) out[f] = data[f];
  }
  return out;
}

export class ProductService {
  async createProduct(companyId: string, data: any) {
    return db.$transaction(async (tx: any) => {
      const code = data.code || (await generateCode(companyId, 'product', tx));
      return tx.product.create({
        data: {
          ...buildProductData(data),
          companyId,
          code,
        },
      });
    });
  }

  async updateProduct(companyId: string, id: string, data: any) {
    // Scope by companyId to prevent cross-tenant IDOR.
    const existing = await db.product.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Product not found', 404);

    return db.product.update({
      where: { id },
      data: buildProductData(data),
    });
  }

  async listProducts(
    companyId: string,
    filters: { search?: string; categoryId?: string; manufacturerId?: string },
  ) {
    const where: any = { companyId };
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { genericName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.manufacturerId) where.manufacturerId = filters.manufacturerId;

    return db.product.findMany({
      where,
      include: {
        category: true,
        manufacturer: true,
        rack: true,
        batches: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getProductById(companyId: string, id: string) {
    const product = await db.product.findFirst({
      where: { id, companyId },
      include: {
        category: true,
        manufacturer: true,
        rack: true,
        batches: true,
      },
    });

    if (!product) return null;
    const totalStock = product.batches.reduce((sum: number, b: any) => sum + b.currentQty, 0);
    return { ...product, totalStock };
  }

  async getBatchStockList(companyId: string, productId: string) {
    // Verify the product belongs to the caller's company before exposing batches.
    const product = await db.product.findFirst({ where: { id: productId, companyId } });
    if (!product) throw new AppError('Product not found', 404);

    const now = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(now.getDate() + 90);

    const batches = await db.batch.findMany({
      where: { productId },
      orderBy: { expiryDate: 'asc' },
    });

    return batches.map((batch: any) => ({
      ...batch,
      isExpired: batch.expiryDate < now,
      isNearExpiry: batch.expiryDate >= now && batch.expiryDate <= ninetyDaysFromNow,
    }));
  }

  async getLowStockProducts(companyId: string) {
    const products = await db.product.findMany({
      where: { companyId },
      include: {
        batches: true,
      },
    });

    return products
      .map((p: any) => {
        const totalStock = p.batches.reduce((sum: number, b: any) => sum + b.currentQty, 0);
        return { ...p, totalStock };
      })
      .filter((p: any) => p.totalStock <= p.minStock);
  }
}

export const productService = new ProductService();
