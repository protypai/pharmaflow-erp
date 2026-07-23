// src/data/mockData.js — Real Indian Pharma Demo Data (Emptied as requested)

export const companyInfo = {};
export const manufacturers = [];
export const categories = [];
export const racks = [];
export const suppliers = [];
export const customers = [];
export const products = [];
export const purchases = [];
export const sales = [];

export const dashboardStats = {
  todaySales: { amount: 0, count: 0, invoices: [] },
  todayPurchase: { amount: 0, count: 0 },
  todayCollections: { amount: 0, count: 0 },
  todayPayments: { amount: 0, count: 0 },
  cashBalance: 0,
  bankBalance: 0,
  outstandingReceivable: 0,
  outstandingPayable: 0,
  nearExpiry: 0,
  expiredStock: 0,
  lowStock: 0,
  outOfStock: 0,
  deadStock: 0,
  newCustomers: 0,
  pendingReturns: 0,
};

export const salesTrend = [];
export const outstandingAging = [];
export const topProducts = [];
export const recentActivities = [];
export const customerLedger = { entries: [] };
export const adminCompanies = [];
export const adminActivityLogs = [];

export const salesmen = [];
export const areas = [];
export const paymentModes = ['Cash', 'Cheque', 'NEFT/RTGS', 'UPI', 'Credit Card'];
export const gstRates = [0, 5, 12, 18];
export const gstTypes = ['Exclusive', 'Inclusive'];
export const returnReasons = ['Near Expiry', 'Expired', 'Damaged', 'Wrong Product', 'Excess Supply', 'Quality Issue'];
export const adjustmentReasons = ['Physical Count', 'Damage', 'Lost/Theft', 'Expired Destroyed', 'Other'];
