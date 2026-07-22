import { db } from '../config/database';

export async function generateCode(prefix: string, tableName: 'customer' | 'supplier' | 'product'): Promise<string> {
  let count = 0;
  if (tableName === 'customer') {
    count = await db.customer.count();
  } else if (tableName === 'supplier') {
    count = await db.supplier.count();
  } else if (tableName === 'product') {
    count = await db.product.count();
  }
  const nextNum = (count + 1).toString().padStart(4, '0');
  return `${prefix}-${nextNum}`;
}
