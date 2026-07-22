import { db } from '../config/database';
import { generateCode } from '../utils/codeGenerator';

export class ProductService {
  async createProduct(data: any) {
    const code = data.code || await generateCode('MED', 'product');
    return db.product.create({
      data: {
        ...data,
        code
      }
    });
  }

  async updateProduct(id: string, data: any) {
    return db.product.update({
      where: { id },
      data
    });
  }

  async listProducts(filters: { search?: string; categoryId?: string; manufacturerId?: string }) {
    const where: any = {};
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { genericName: { contains: filters.search, mode: 'insensitive' } }
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
        batches: true
      },
      orderBy: { name: 'asc' }
    });
  }

  async getProductById(id: string) {
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
        manufacturer: true,
        rack: true,
        batches: true
      }
    });

    if (!product) return null;
    const totalStock = product.batches.reduce((sum: number, b: any) => sum + b.currentQty, 0);
    return { ...product, totalStock };
  }

  async getBatchStockList(productId: string) {
    const now = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(now.getDate() + 90);

    const batches = await db.batch.findMany({
      where: { productId },
      orderBy: { expiryDate: 'asc' }
    });

    return batches.map((batch: any) => ({
      ...batch,
      isExpired: batch.expiryDate < now,
      isNearExpiry: batch.expiryDate >= now && batch.expiryDate <= ninetyDaysFromNow
    }));
  }

  async getLowStockProducts() {
    const products = await db.product.findMany({
      include: {
        batches: true
      }
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
