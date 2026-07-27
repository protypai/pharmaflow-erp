import { z } from 'zod';

/**
 * Central zod schemas for all mutating endpoints. Object schemas strip unknown keys by default,
 * which — together with explicit field lists in the services — prevents mass-assignment.
 */

const paymentModeEnum = z.enum([
  'cash',
  'cheque',
  'neft_rtgs',
  'upi',
  'credit_card',
  'credit',
]);
const gstTypeEnum = z.enum(['exclusive', 'inclusive']);
const returnReasonEnum = z.enum([
  'near_expiry',
  'expired',
  'damaged',
  'wrong_product',
  'excess_supply',
  'quality_issue',
]);
const adjustmentReasonEnum = z.enum([
  'physical_count',
  'damage',
  'lost_theft',
  'expired_destroyed',
  'other',
]);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  companyName: z.string().min(1),
  shortName: z.string().optional(),
  gstin: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Admin ────────────────────────────────────────────────────────────────────

export const resetPasswordSchema = z.object({
  companyId: z.string().min(1),
  newPassword: z.string().min(6),
  userId: z.string().optional(),
  email: z.string().email().optional(),
});

// ─── Product ──────────────────────────────────────────────────────────────────

export const productCreateSchema = z.object({
  code: z.string().optional(),
  barcode: z.string().optional(),
  name: z.string().min(1),
  genericName: z.string().optional(),
  manufacturerId: z.string().optional(),
  categoryId: z.string().optional(),
  rackId: z.string().optional(),
  packing: z.string().optional(),
  purchaseUnit: z.string().optional(),
  saleUnit: z.string().optional(),
  conversionFactor: z.coerce.number().optional(),
  hsnCode: z.string().optional(),
  gstRate: z.coerce.number().optional(),
  schedule: z.string().optional(),
  minStock: z.coerce.number().optional(),
  maxStock: z.coerce.number().optional(),
  reorderQty: z.coerce.number().optional(),
  discontinued: z.boolean().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const productUpdateSchema = productCreateSchema.partial();

// ─── Customer ─────────────────────────────────────────────────────────────────

export const customerCreateSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1),
  type: z.enum(['retail', 'wholesale']).optional(),
  gstin: z.string().optional(),
  drugLicense: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  area: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  salesman: z.string().optional(),
  creditLimit: z.coerce.number().optional(),
  creditDays: z.coerce.number().int().optional(),
  openingBalance: z.coerce.number().optional(),
  openingBalanceType: z.enum(['debit', 'credit']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const customerUpdateSchema = customerCreateSchema.partial();

// ─── Supplier ─────────────────────────────────────────────────────────────────

export const supplierCreateSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1),
  gstin: z.string().optional(),
  drugLicense: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  creditDays: z.coerce.number().int().optional(),
  creditLimit: z.coerce.number().optional(),
  openingBalance: z.coerce.number().optional(),
  openingBalanceType: z.enum(['debit', 'credit']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const supplierUpdateSchema = supplierCreateSchema.partial();

// ─── Sales ────────────────────────────────────────────────────────────────────

const saleItemSchema = z.object({
  productId: z.string().min(1),
  batchId: z.string().min(1),
  qty: z.coerce.number(),
  freeQty: z.coerce.number().optional(),
  mrp: z.coerce.number(),
  ptr: z.coerce.number(),
  salePrice: z.coerce.number(),
  discPercent: z.coerce.number().optional(),
  discAmount: z.coerce.number().optional(),
  gstRate: z.coerce.number(),
  cgst: z.coerce.number().optional(),
  sgst: z.coerce.number().optional(),
  igst: z.coerce.number().optional(),
  isIgst: z.boolean().optional(),
  taxableAmt: z.coerce.number().optional(),
  netAmount: z.coerce.number().optional(),
});

export const saleCreateSchema = z.object({
  invoiceNo: z.string().optional(),
  customerId: z.string().min(1),
  date: z.coerce.date(),
  salesman: z.string().optional(),
  gstType: gstTypeEnum.optional(),
  roundOff: z.coerce.number().optional(),
  paymentMode: paymentModeEnum.optional(),
  paidAmount: z.coerce.number().optional(),
  notes: z.string().optional(),
  items: z.array(saleItemSchema).min(1),
});

// ─── Purchase ─────────────────────────────────────────────────────────────────

const purchaseItemSchema = z.object({
  productId: z.string().min(1),
  batchId: z.string().optional(),
  batchNo: z.string().optional(),
  expiryDate: z.coerce.date().optional(),
  qty: z.coerce.number(),
  freeQty: z.coerce.number().optional(),
  purchasePrice: z.coerce.number(),
  ptr: z.coerce.number(),
  mrp: z.coerce.number(),
  pts: z.coerce.number().optional(),
  discPercent: z.coerce.number().optional(),
  discAmount: z.coerce.number().optional(),
  gstRate: z.coerce.number(),
  cgst: z.coerce.number().optional(),
  sgst: z.coerce.number().optional(),
  igst: z.coerce.number().optional(),
  isIgst: z.boolean().optional(),
  taxableAmt: z.coerce.number().optional(),
  netAmount: z.coerce.number().optional(),
});

export const purchaseCreateSchema = z.object({
  entryNo: z.string().optional(),
  supplierId: z.string().min(1),
  invoiceNo: z.string().min(1),
  invoiceDate: z.coerce.date(),
  gstType: gstTypeEnum.optional(),
  roundOff: z.coerce.number().optional(),
  paymentMode: paymentModeEnum.optional(),
  paidAmount: z.coerce.number().optional(),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1),
});

// ─── Returns ──────────────────────────────────────────────────────────────────

const purchaseReturnItemSchema = z.object({
  productId: z.string().min(1),
  batchId: z.string().min(1),
  qty: z.coerce.number(),
  mrp: z.coerce.number(),
  ptr: z.coerce.number(),
  netAmount: z.coerce.number(),
  reason: returnReasonEnum.optional(),
});

export const purchaseReturnCreateSchema = z.object({
  entryNo: z.string().optional(),
  purchaseId: z.string().optional(),
  supplierId: z.string().min(1),
  returnDate: z.coerce.date(),
  reason: z.string().optional(),
  debitNoteNo: z.string().optional(),
  items: z.array(purchaseReturnItemSchema).min(1),
});

const saleReturnItemSchema = z.object({
  productId: z.string().min(1),
  batchId: z.string().min(1),
  qty: z.coerce.number(),
  mrp: z.coerce.number(),
  salePrice: z.coerce.number(),
  netAmount: z.coerce.number(),
  reason: returnReasonEnum.optional(),
});

export const saleReturnCreateSchema = z.object({
  entryNo: z.string().optional(),
  saleId: z.string().optional(),
  customerId: z.string().min(1),
  returnDate: z.coerce.date(),
  reason: z.string().optional(),
  creditNoteNo: z.string().optional(),
  items: z.array(saleReturnItemSchema).min(1),
});

// ─── Accounts ─────────────────────────────────────────────────────────────────

export const receiptCreateSchema = z.object({
  receiptNo: z.string().optional(),
  customerId: z.string().min(1),
  date: z.coerce.date(),
  amount: z.coerce.number(),
  paymentMode: paymentModeEnum,
  chequeNo: z.string().optional(),
  chequeDate: z.coerce.date().optional(),
  bankName: z.string().optional(),
  utrNo: z.string().optional(),
  notes: z.string().optional(),
});

export const paymentCreateSchema = z.object({
  paymentNo: z.string().optional(),
  supplierId: z.string().min(1),
  date: z.coerce.date(),
  amount: z.coerce.number(),
  paymentMode: paymentModeEnum,
  chequeNo: z.string().optional(),
  chequeDate: z.coerce.date().optional(),
  bankName: z.string().optional(),
  utrNo: z.string().optional(),
  notes: z.string().optional(),
});

const journalEntrySchema = z.object({
  particular: z.string().min(1),
  type: z.enum(['debit', 'credit']),
  amount: z.coerce.number(),
});

export const journalCreateSchema = z.object({
  entryNo: z.string().optional(),
  date: z.coerce.date(),
  narration: z.string().min(1),
  debitAmt: z.coerce.number(),
  creditAmt: z.coerce.number(),
  entries: z.array(journalEntrySchema).min(1),
});

// ─── Stock Adjustment ─────────────────────────────────────────────────────────

const stockAdjustmentItemSchema = z.object({
  productId: z.string().min(1),
  batchId: z.string().min(1),
  systemQty: z.coerce.number(),
  physicalQty: z.coerce.number(),
  differenceQty: z.coerce.number(),
  reason: adjustmentReasonEnum.optional(),
});

export const stockAdjustmentCreateSchema = z.object({
  entryNo: z.string().optional(),
  date: z.coerce.date(),
  reason: adjustmentReasonEnum,
  notes: z.string().optional(),
  items: z.array(stockAdjustmentItemSchema).min(1),
});

// ─── Sync ─────────────────────────────────────────────────────────────────────

const syncItemSchema = z.object({
  id: z.string().min(1),
  tableName: z.string().min(1),
  operation: z.enum(['create', 'update', 'delete']),
  recordId: z.string().min(1),
  payload: z.record(z.any()).optional().default({}),
});

export const syncPushSchema = z.object({
  deviceId: z.string().optional(),
  appVersion: z.string().optional(),
  items: z.array(syncItemSchema),
});
