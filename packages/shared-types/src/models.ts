export interface Company {
  id: string;
  name: string;
  shortName?: string;
  gstin?: string;
  drugLicense20B?: string;
  drugLicense21B?: string;
  fssaiLicense?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  stateCode?: string;
  phone?: string;
  email?: string;
  financialYear: string;
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
  upiId?: string;
}

export interface User {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  isActive: boolean;
  lastLoginAt?: string;
}

export interface Product {
  id: string;
  companyId: string;
  code: string;
  barcode?: string;
  name: string;
  genericName?: string;
  manufacturerId?: string;
  categoryId?: string;
  rackId?: string;
  packing?: string;
  purchaseUnit?: string;
  saleUnit?: string;
  hsnCode?: string;
  gstRate: number;
  schedule?: string;
  minStock: number;
  maxStock: number;
  reorderQty: number;
  discontinued: boolean;
  status: 'active' | 'inactive';
}

export interface Batch {
  id: string;
  productId: string;
  batchNo: string;
  expiryDate: string;
  mrp: number;
  ptr: number;
  pts?: number;
  purchasePrice: number;
  gstRate: number;
  currentQty: number;
  freeQty: number;
}

export interface Customer {
  id: string;
  companyId: string;
  code?: string;
  name: string;
  type: 'retail' | 'wholesale';
  gstin?: string;
  drugLicense?: string;
  phone?: string;
  email?: string;
  address?: string;
  area?: string;
  creditLimit: number;
  creditDays: number;
  openingBalance: number;
  status: 'active' | 'inactive';
}

export interface Supplier {
  id: string;
  companyId: string;
  code?: string;
  name: string;
  gstin?: string;
  drugLicense?: string;
  phone?: string;
  email?: string;
  creditDays: number;
  creditLimit: number;
  openingBalance: number;
  status: 'active' | 'inactive';
}

export interface Sale {
  id: string;
  companyId: string;
  invoiceNo: string;
  customerId: string;
  date: string;
  salesman?: string;
  gstType: 'exclusive' | 'inclusive';
  netAmount: number;
  paymentMode: string;
  paidAmount: number;
  status: 'draft' | 'saved' | 'cancelled';
}

export interface Purchase {
  id: string;
  companyId: string;
  entryNo: string;
  supplierId: string;
  invoiceNo: string;
  invoiceDate: string;
  gstType: 'exclusive' | 'inclusive';
  netAmount: number;
  paymentMode: string;
  paidAmount: number;
  status: 'draft' | 'saved' | 'cancelled';
}
