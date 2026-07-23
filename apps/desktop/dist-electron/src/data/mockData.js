"use strict";
// src/data/mockData.js — Real Indian Pharma Demo Data (Emptied as requested)
Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustmentReasons = exports.returnReasons = exports.gstTypes = exports.gstRates = exports.paymentModes = exports.areas = exports.salesmen = exports.adminActivityLogs = exports.adminCompanies = exports.customerLedger = exports.recentActivities = exports.topProducts = exports.outstandingAging = exports.salesTrend = exports.dashboardStats = exports.sales = exports.purchases = exports.products = exports.customers = exports.suppliers = exports.racks = exports.categories = exports.manufacturers = exports.companyInfo = void 0;
exports.companyInfo = {};
exports.manufacturers = [];
exports.categories = [];
exports.racks = [];
exports.suppliers = [];
exports.customers = [];
exports.products = [];
exports.purchases = [];
exports.sales = [];
exports.dashboardStats = {
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
exports.salesTrend = [];
exports.outstandingAging = [];
exports.topProducts = [];
exports.recentActivities = [];
exports.customerLedger = { entries: [] };
exports.adminCompanies = [];
exports.adminActivityLogs = [];
exports.salesmen = [];
exports.areas = [];
exports.paymentModes = ['Cash', 'Cheque', 'NEFT/RTGS', 'UPI', 'Credit Card'];
exports.gstRates = [0, 5, 12, 18];
exports.gstTypes = ['Exclusive', 'Inclusive'];
exports.returnReasons = ['Near Expiry', 'Expired', 'Damaged', 'Wrong Product', 'Excess Supply', 'Quality Issue'];
exports.adjustmentReasons = ['Physical Count', 'Damage', 'Lost/Theft', 'Expired Destroyed', 'Other'];
