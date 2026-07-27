import { db } from '../config/database';

/**
 * Document types we generate sequential numbers for. Each maps to the model + the
 * unique string field that carries the number, and a human-friendly prefix.
 */
export type DocType =
  | 'sale'
  | 'purchase'
  | 'purchaseReturn'
  | 'saleReturn'
  | 'product'
  | 'customer'
  | 'supplier'
  | 'receipt'
  | 'payment'
  | 'journal'
  | 'stockAdjustment';

const config: Record<DocType, { prefix: string; field: string; model: string }> = {
  sale: { prefix: 'SAL', field: 'invoiceNo', model: 'sale' },
  purchase: { prefix: 'PUR', field: 'entryNo', model: 'purchase' },
  purchaseReturn: { prefix: 'PRN', field: 'entryNo', model: 'purchaseReturn' },
  saleReturn: { prefix: 'SRN', field: 'entryNo', model: 'saleReturn' },
  product: { prefix: 'MED', field: 'code', model: 'product' },
  customer: { prefix: 'CUST', field: 'code', model: 'customer' },
  supplier: { prefix: 'SUP', field: 'code', model: 'supplier' },
  receipt: { prefix: 'RCP', field: 'receiptNo', model: 'receipt' },
  payment: { prefix: 'PAY', field: 'paymentNo', model: 'payment' },
  journal: { prefix: 'JRN', field: 'entryNo', model: 'journal' },
  stockAdjustment: { prefix: 'ADJ', field: 'entryNo', model: 'stockAdjustment' },
};

/**
 * Generate the next document number for a company + document type.
 *
 * The sequence is derived PER-COMPANY and PER-DOCUMENT-TYPE (never global), and uses
 * max(existing sequence) + 1 so numbers are not reused after a record is deleted.
 *
 * Pass the transaction client (`tx`) so the read happens inside the same transaction as the
 * insert; combined with the `@@unique([companyId, <field>])` constraints this is safe under
 * normal concurrency (a rare race simply fails the unique constraint and the caller can retry).
 */
export async function generateCode(
  companyId: string,
  docType: DocType,
  client: any = db,
): Promise<string> {
  const { prefix, field, model } = config[docType];
  const delegate = (client as any)[model];

  const rows: Array<Record<string, any>> = await delegate.findMany({
    where: { companyId },
    select: { [field]: true },
  });

  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  let maxSeq = 0;
  for (const row of rows) {
    const value = row[field];
    if (typeof value !== 'string') continue;
    const match = pattern.exec(value);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxSeq) maxSeq = n;
    }
  }

  const nextNum = (maxSeq + 1).toString().padStart(4, '0');
  return `${prefix}-${nextNum}`;
}
