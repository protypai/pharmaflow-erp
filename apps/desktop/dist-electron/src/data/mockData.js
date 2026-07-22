"use strict";
// src/data/mockData.js — Real Indian Pharma Demo Data
Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustmentReasons = exports.returnReasons = exports.gstTypes = exports.gstRates = exports.paymentModes = exports.areas = exports.salesmen = exports.adminActivityLogs = exports.adminCompanies = exports.customerLedger = exports.recentActivities = exports.topProducts = exports.outstandingAging = exports.salesTrend = exports.dashboardStats = exports.sales = exports.purchases = exports.products = exports.customers = exports.suppliers = exports.racks = exports.categories = exports.manufacturers = exports.companyInfo = void 0;
exports.companyInfo = {
    name: 'Sharma Medical Distributors Pvt. Ltd.',
    shortName: 'Sharma Medicals',
    gstin: '27AABCS1429B1Z6',
    drugLicense: 'MH-2024-DL-001423',
    address: '14, Kasturba Market, Dadar West, Mumbai - 400028',
    phone: '+91 98765 43210',
    email: 'sharma.medicals@gmail.com',
    financialYear: 'FY 2025-26',
    city: 'Mumbai',
};
exports.manufacturers = [
    { id: 1, name: 'Sun Pharmaceutical Industries' },
    { id: 2, name: 'Cipla Ltd.' },
    { id: 3, name: 'Dr. Reddy\'s Laboratories' },
    { id: 4, name: 'Alkem Laboratories' },
    { id: 5, name: 'Mankind Pharma' },
    { id: 6, name: 'Lupin Limited' },
    { id: 7, name: 'Abbott India' },
    { id: 8, name: 'Zydus Cadila' },
    { id: 9, name: 'Torrent Pharmaceuticals' },
    { id: 10, name: 'GSK Pharma India' },
];
exports.categories = [
    { id: 1, name: 'Tablet' },
    { id: 2, name: 'Capsule' },
    { id: 3, name: 'Injection' },
    { id: 4, name: 'Syrup / Suspension' },
    { id: 5, name: 'Cream / Ointment' },
    { id: 6, name: 'Eye / Ear Drops' },
    { id: 7, name: 'Surgical' },
    { id: 8, name: 'Powder' },
    { id: 9, name: 'Inhaler' },
    { id: 10, name: 'Sachet' },
];
exports.racks = [
    { id: 1, name: 'A-1' }, { id: 2, name: 'A-2' }, { id: 3, name: 'A-3' },
    { id: 4, name: 'B-1' }, { id: 5, name: 'B-2' }, { id: 6, name: 'B-3' },
    { id: 7, name: 'C-1' }, { id: 8, name: 'C-2' },
    { id: 9, name: 'D-1' }, { id: 10, name: 'D-2' },
    { id: 11, name: 'E-1' }, { id: 12, name: 'FRIDGE' },
];
exports.suppliers = [
    {
        id: 1, name: 'Sun Pharma CFA Mumbai', gstin: '27AAACS4699B1Z4',
        drugLicense: 'MH-CFA-2022-SUN001', phone: '022-40398000',
        email: 'cfa.mumbai@sunpharma.com', address: 'Andheri East, Mumbai',
        creditDays: 45, creditLimit: 500000, openingBalance: 120000,
        city: 'Mumbai', status: 'active',
    },
    {
        id: 2, name: 'Cipla CFA Pune', gstin: '27AAACI1681G1ZX',
        drugLicense: 'MH-CFA-2021-CIP002', phone: '020-25899000',
        email: 'cfa.pune@cipla.com', address: 'Hadapsar, Pune',
        creditDays: 30, creditLimit: 300000, openingBalance: 85000,
        city: 'Pune', status: 'active',
    },
    {
        id: 3, name: 'Alkem Laboratories CFA', gstin: '27AABCA6378M1ZG',
        drugLicense: 'MH-CFA-2023-ALK003', phone: '022-33058800',
        email: 'cfa@alkemlabs.com', address: 'Badlapur, Thane',
        creditDays: 60, creditLimit: 400000, openingBalance: 62000,
        city: 'Thane', status: 'active',
    },
    {
        id: 4, name: 'Mankind Pharma CFA', gstin: '07AAFCM4649E1Z3',
        drugLicense: 'DL-CFA-2022-MAN004', phone: '011-41845000',
        email: 'cfa@mankindpharma.com', address: 'Okhla, New Delhi',
        creditDays: 45, creditLimit: 250000, openingBalance: 38000,
        city: 'Delhi', status: 'active',
    },
    {
        id: 5, name: 'Lupin CFA Nashik', gstin: '27AABCL6959P1ZQ',
        drugLicense: 'MH-CFA-2020-LUP005', phone: '0253-6611000',
        email: 'cfa.nashik@lupin.com', address: 'MIDC, Nashik',
        creditDays: 30, creditLimit: 350000, openingBalance: 95000,
        city: 'Nashik', status: 'active',
    },
];
exports.customers = [
    {
        id: 1, name: 'Balaji Medical Stores', type: 'Retail',
        gstin: '', drugLicense: 'MH-DL-R-2021-BMS001',
        phone: '98765 11001', email: 'balaji.meds@gmail.com',
        address: '12, Gokhale Road, Dadar, Mumbai - 400028',
        area: 'Dadar', salesman: 'Ramesh Kumar',
        creditLimit: 50000, creditDays: 30, openingBalance: 8500,
        outstanding: 28500, status: 'active',
    },
    {
        id: 2, name: 'Gupta Medico & Surgical', type: 'Wholesale',
        gstin: '27AAAPG1234A1Z5', drugLicense: 'MH-DL-W-2019-GMS002',
        phone: '98765 22002', email: 'gupta.medico@gmail.com',
        address: '45, Dr. Ambedkar Road, Parel, Mumbai - 400012',
        area: 'Parel', salesman: 'Suresh Patil',
        creditLimit: 200000, creditDays: 45, openingBalance: 35000,
        outstanding: 142000, status: 'active',
    },
    {
        id: 3, name: 'Shree Ram Medical Agency', type: 'Wholesale',
        gstin: '27AAAPS9876B1Z3', drugLicense: 'MH-DL-W-2020-SRM003',
        phone: '98765 33003', email: 'shreeram.meds@gmail.com',
        address: '78, Parel Village, Mumbai - 400012',
        area: 'Parel', salesman: 'Ramesh Kumar',
        creditLimit: 150000, creditDays: 30, openingBalance: 12000,
        outstanding: 87500, status: 'active',
    },
    {
        id: 4, name: 'Sai Krupa Medical Hall', type: 'Retail',
        gstin: '', drugLicense: 'MH-DL-R-2022-SKM004',
        phone: '98765 44004', email: '',
        address: '3, Shivaji Nagar, Kurla West, Mumbai - 400070',
        area: 'Kurla', salesman: 'Suresh Patil',
        creditLimit: 30000, creditDays: 15, openingBalance: 0,
        outstanding: 12500, status: 'active',
    },
    {
        id: 5, name: 'Apollo Pharmacy - Bandra', type: 'Retail',
        gstin: '27AABCA1234C1ZX', drugLicense: 'MH-DL-R-2021-APB005',
        phone: '98765 55005', email: 'bandra@apollopharmacy.in',
        address: '10, Hill Road, Bandra West, Mumbai - 400050',
        area: 'Bandra', salesman: 'Mahesh Joshi',
        creditLimit: 100000, creditDays: 30, openingBalance: 25000,
        outstanding: 58000, status: 'active',
    },
    {
        id: 6, name: 'Kamlesh Medical Stores', type: 'Retail',
        gstin: '', drugLicense: 'MH-DL-R-2023-KMS006',
        phone: '98765 66006', email: '',
        address: '5, Tilak Road, Ghatkopar East, Mumbai - 400077',
        area: 'Ghatkopar', salesman: 'Mahesh Joshi',
        creditLimit: 25000, creditDays: 15, openingBalance: 0,
        outstanding: 0, status: 'active',
    },
];
exports.products = [
    {
        id: 1, code: 'MED001', barcode: '8901234560001',
        name: 'Crocin 500mg Tablet', genericName: 'Paracetamol 500mg',
        manufacturer: 'GSK Pharma India', manufacturerId: 10,
        category: 'Tablet', categoryId: 1,
        packing: '15 Tabs/Strip', hsn: '3004', gst: 12,
        rack: 'A-1', minStock: 100, maxStock: 1000, orderQty: 500,
        purchaseUnit: 'Box (10 Strips)', saleUnit: 'Strip',
        status: 'active', discontinued: false,
        batches: [
            { batch: 'CR240801A', expiry: '03/27', mrp: 15, ptr: 12, pts: 11, purchasePrice: 10, qty: 450, freeQty: 0, gst: 12 },
            { batch: 'CR241001B', expiry: '05/26', mrp: 16, ptr: 13, pts: 12, purchasePrice: 11, qty: 200, freeQty: 0, gst: 12 },
        ],
    },
    {
        id: 2, code: 'MED002', barcode: '8901234560002',
        name: 'Azithral 500mg Tablet', genericName: 'Azithromycin 500mg',
        manufacturer: 'Cipla Ltd.', manufacturerId: 2,
        category: 'Tablet', categoryId: 1,
        packing: '3 Tabs/Strip', hsn: '3004', gst: 12,
        rack: 'A-2', minStock: 50, maxStock: 500, orderQty: 200,
        purchaseUnit: 'Box (10 Strips)', saleUnit: 'Strip',
        status: 'active', discontinued: false,
        batches: [
            { batch: 'AZ240601C', expiry: '08/26', mrp: 180, ptr: 145, pts: 138, purchasePrice: 130, qty: 0, freeQty: 0, gst: 12 },
            { batch: 'AZ240901D', expiry: '09/26', mrp: 182, ptr: 147, pts: 140, purchasePrice: 132, qty: 10, freeQty: 0, gst: 12 },
        ],
    },
    {
        id: 3, code: 'MED003', barcode: '8901234560003',
        name: 'Pan-D Capsule', genericName: 'Pantoprazole + Domperidone',
        manufacturer: 'Alkem Laboratories', manufacturerId: 4,
        category: 'Capsule', categoryId: 2,
        packing: '10 Caps/Strip', hsn: '3004', gst: 12,
        rack: 'B-1', minStock: 80, maxStock: 800, orderQty: 300,
        purchaseUnit: 'Box (10 Strips)', saleUnit: 'Strip',
        status: 'active', discontinued: false,
        batches: [
            { batch: 'PD240701E', expiry: '07/27', mrp: 185, ptr: 148, pts: 140, purchasePrice: 132, qty: 380, freeQty: 0, gst: 12 },
        ],
    },
    {
        id: 4, code: 'MED004', barcode: '8901234560004',
        name: 'Glycomet 500mg Tablet', genericName: 'Metformin HCl 500mg',
        manufacturer: 'USV Pvt. Ltd.', manufacturerId: 8,
        category: 'Tablet', categoryId: 1,
        packing: '20 Tabs/Strip', hsn: '3004', gst: 5,
        rack: 'A-3', minStock: 200, maxStock: 2000, orderQty: 1000,
        purchaseUnit: 'Box (10 Strips)', saleUnit: 'Strip',
        status: 'active', discontinued: false,
        batches: [
            { batch: 'GM240801F', expiry: '01/28', mrp: 32, ptr: 26, pts: 24, purchasePrice: 22, qty: 850, freeQty: 0, gst: 5 },
        ],
    },
    {
        id: 5, code: 'MED005', barcode: '8901234560005',
        name: 'Augmentin 625mg Tablet', genericName: 'Amoxicillin + Clavulanic Acid',
        manufacturer: 'GSK Pharma India', manufacturerId: 10,
        category: 'Tablet', categoryId: 1,
        packing: '6 Tabs/Strip', hsn: '3004', gst: 12,
        rack: 'A-2', minStock: 100, maxStock: 600, orderQty: 300,
        purchaseUnit: 'Box (10 Strips)', saleUnit: 'Strip',
        status: 'active', discontinued: false,
        batches: [
            { batch: 'AG240601G', expiry: '07/27', mrp: 385, ptr: 310, pts: 295, purchasePrice: 280, qty: 30, freeQty: 0, gst: 12 },
            { batch: 'AG241001H', expiry: '01/28', mrp: 390, ptr: 314, pts: 298, purchasePrice: 285, qty: 200, freeQty: 0, gst: 12 },
        ],
    },
    {
        id: 6, code: 'MED006', barcode: '8901234560006',
        name: 'Dolo 650mg Tablet', genericName: 'Paracetamol 650mg',
        manufacturer: 'Micro Labs Ltd.', manufacturerId: 7,
        category: 'Tablet', categoryId: 1,
        packing: '15 Tabs/Strip', hsn: '3004', gst: 0,
        rack: 'A-1', minStock: 200, maxStock: 2000, orderQty: 1000,
        purchaseUnit: 'Box (10 Strips)', saleUnit: 'Strip',
        status: 'active', discontinued: false,
        batches: [
            { batch: 'DL241101I', expiry: '07/27', mrp: 30, ptr: 24, pts: 22, purchasePrice: 20, qty: 1200, freeQty: 0, gst: 0 },
        ],
    },
    {
        id: 7, code: 'MED007', barcode: '8901234560007',
        name: 'Ecosprin 75mg Tablet', genericName: 'Aspirin 75mg',
        manufacturer: 'USV Pvt. Ltd.', manufacturerId: 8,
        category: 'Tablet', categoryId: 1,
        packing: '14 Tabs/Strip', hsn: '3004', gst: 5,
        rack: 'B-2', minStock: 150, maxStock: 1500, orderQty: 500,
        purchaseUnit: 'Box (10 Strips)', saleUnit: 'Strip',
        status: 'active', discontinued: false,
        batches: [
            { batch: 'EC241001J', expiry: '01/28', mrp: 22, ptr: 17, pts: 16, purchasePrice: 15, qty: 680, freeQty: 0, gst: 5 },
        ],
    },
    {
        id: 8, code: 'MED008', barcode: '8901234560008',
        name: 'Ciplox 500mg Tablet', genericName: 'Ciprofloxacin 500mg',
        manufacturer: 'Cipla Ltd.', manufacturerId: 2,
        category: 'Tablet', categoryId: 1,
        packing: '10 Tabs/Strip', hsn: '3004', gst: 12,
        rack: 'A-3', minStock: 60, maxStock: 600, orderQty: 200,
        purchaseUnit: 'Box (10 Strips)', saleUnit: 'Strip',
        status: 'active', discontinued: false,
        batches: [
            { batch: 'CP240501K', expiry: '06/26', mrp: 165, ptr: 132, pts: 125, purchasePrice: 118, qty: 15, freeQty: 0, gst: 12 },
        ],
    },
    {
        id: 9, code: 'MED009', barcode: '8901234560009',
        name: 'Betadine 100ml Solution', genericName: 'Povidone-Iodine 10%',
        manufacturer: 'Win-Medicare Pvt. Ltd.', manufacturerId: 9,
        category: 'Surgical', categoryId: 7,
        packing: '100ml Bottle', hsn: '3808', gst: 18,
        rack: 'D-1', minStock: 50, maxStock: 500, orderQty: 200,
        purchaseUnit: 'Carton (24 Bottles)', saleUnit: 'Bottle',
        status: 'active', discontinued: false,
        batches: [
            { batch: 'BD241201L', expiry: '03/27', mrp: 98, ptr: 78, pts: 74, purchasePrice: 70, qty: 185, freeQty: 0, gst: 18 },
        ],
    },
    {
        id: 10, code: 'MED010', barcode: '8901234560010',
        name: 'Montair LC Tablet', genericName: 'Montelukast + Levocetirizine',
        manufacturer: 'Cipla Ltd.', manufacturerId: 2,
        category: 'Tablet', categoryId: 1,
        packing: '10 Tabs/Strip', hsn: '3004', gst: 12,
        rack: 'B-3', minStock: 100, maxStock: 800, orderQty: 300,
        purchaseUnit: 'Box (10 Strips)', saleUnit: 'Strip',
        status: 'active', discontinued: false,
        batches: [
            { batch: 'ML241001M', expiry: '07/27', mrp: 225, ptr: 180, pts: 171, purchasePrice: 162, qty: 320, freeQty: 0, gst: 12 },
        ],
    },
];
exports.purchases = [
    {
        id: 1, entryNo: 'PUR-001', supplier: 'Sun Pharma CFA Mumbai', supplierId: 1,
        invoiceNo: 'SP/2025/14521', invoiceDate: '2025-07-05',
        gstType: 'Exclusive', netAmount: 124580, status: 'saved',
        items: [
            { product: 'Crocin 500mg Tablet', batch: 'CR240801A', expiry: '03/27', qty: 500, free: 50, ptr: 12, mrp: 15, disc: 0, gst: 12, net: 6720 },
            { product: 'Augmentin 625mg Tablet', batch: 'AG241001H', expiry: '01/28', qty: 200, free: 0, ptr: 314, mrp: 390, disc: 2, gst: 12, net: 70592 },
        ],
    },
    {
        id: 2, entryNo: 'PUR-002', supplier: 'Cipla CFA Pune', supplierId: 2,
        invoiceNo: 'CIP/2025/8833', invoiceDate: '2025-07-08',
        gstType: 'Exclusive', netAmount: 67250, status: 'saved',
        items: [
            { product: 'Azithral 500mg Tablet', batch: 'AZ240901D', expiry: '07/27', qty: 150, free: 15, ptr: 147, mrp: 182, disc: 0, gst: 12, net: 24696 },
            { product: 'Montair LC Tablet', batch: 'ML241001M', expiry: '07/27', qty: 300, free: 0, ptr: 180, mrp: 225, disc: 5, gst: 12, net: 57456 },
        ],
    },
    {
        id: 3, entryNo: 'PUR-003', supplier: 'Alkem Laboratories CFA', supplierId: 3,
        invoiceNo: 'ALK/2025/5501', invoiceDate: '2025-07-12',
        gstType: 'Exclusive', netAmount: 89320, status: 'saved',
        items: [
            { product: 'Pan-D Capsule', batch: 'PD240701E', expiry: '07/27', qty: 400, free: 40, ptr: 148, mrp: 185, disc: 0, gst: 12, net: 66227 },
        ],
    },
];
exports.sales = [
    {
        id: 1, invoiceNo: 'SAL-001', customer: 'Balaji Medical Stores', customerId: 1,
        date: '2025-07-10', salesman: 'Ramesh Kumar', paymentMode: 'Credit',
        netAmount: 14250, status: 'saved',
    },
    {
        id: 2, invoiceNo: 'SAL-002', customer: 'Gupta Medico & Surgical', customerId: 2,
        date: '2025-07-12', salesman: 'Suresh Patil', paymentMode: 'Credit',
        netAmount: 48600, status: 'saved',
    },
    {
        id: 3, invoiceNo: 'SAL-003', customer: 'Apollo Pharmacy - Bandra', customerId: 5,
        date: '2025-07-14', salesman: 'Mahesh Joshi', paymentMode: 'Credit',
        netAmount: 22400, status: 'saved',
    },
    {
        id: 4, invoiceNo: 'SAL-004', customer: 'Shree Ram Medical Agency', customerId: 3,
        date: '2025-07-15', salesman: 'Ramesh Kumar', paymentMode: 'Credit',
        netAmount: 35800, status: 'saved',
    },
    {
        id: 5, invoiceNo: 'SAL-005', customer: 'Sai Krupa Medical Hall', customerId: 4,
        date: '2025-07-18', salesman: 'Suresh Patil', paymentMode: 'Cash',
        netAmount: 5600, status: 'saved',
    },
    {
        id: 6, invoiceNo: 'SAL-006', customer: 'Balaji Medical Stores', customerId: 1,
        date: '2025-07-20', salesman: 'Ramesh Kumar', paymentMode: 'Credit',
        netAmount: 18900, status: 'saved',
    },
    {
        id: 7, invoiceNo: 'SAL-007', customer: 'Apollo Pharmacy - Bandra', customerId: 5,
        date: '2025-07-21', salesman: 'Mahesh Joshi', paymentMode: 'Credit',
        netAmount: 31200, status: 'saved',
    },
];
exports.dashboardStats = {
    todaySales: { amount: 50100, count: 2, invoices: ['SAL-006', 'SAL-007'] },
    todayPurchase: { amount: 0, count: 0 },
    todayCollections: { amount: 35000, count: 2 },
    todayPayments: { amount: 0, count: 0 },
    cashBalance: 82500,
    bankBalance: 345000,
    outstandingReceivable: 328500,
    outstandingPayable: 400000,
    nearExpiry: 4, // products expiring in 90 days
    expiredStock: 2, // actually expired
    lowStock: 6, // below min stock
    outOfStock: 1,
    deadStock: 3,
    newCustomers: 2, // this month
    pendingReturns: 1,
};
exports.salesTrend = [
    { day: '15 Jul', sales: 22400, purchase: 89320 },
    { day: '16 Jul', sales: 18500, purchase: 0 },
    { day: '17 Jul', sales: 28900, purchase: 67250 },
    { day: '18 Jul', sales: 5600, purchase: 0 },
    { day: '19 Jul', sales: 42000, purchase: 124580 },
    { day: '20 Jul', sales: 18900, purchase: 0 },
    { day: '21 Jul', sales: 50100, purchase: 0 },
];
exports.outstandingAging = [
    { label: '0-30 days', value: 185000, color: '#16A34A' },
    { label: '31-60 days', value: 98000, color: '#D97706' },
    { label: '61-90 days', value: 32000, color: '#DC2626' },
    { label: '90+ days', value: 13500, color: '#7C3AED' },
];
exports.topProducts = [
    { name: 'Dolo 650mg', sales: 48200 },
    { name: 'Pan-D Capsule', sales: 38600 },
    { name: 'Montair LC', sales: 32400 },
    { name: 'Crocin 500mg', sales: 28900 },
    { name: 'Glycomet 500mg', sales: 22100 },
];
exports.recentActivities = [
    { time: '08:42 AM', type: 'sale', desc: 'Sale Invoice SAL-007', party: 'Apollo Pharmacy - Bandra', amount: 31200 },
    { time: '08:15 AM', type: 'receipt', desc: 'Payment Received', party: 'Gupta Medico & Surgical', amount: 35000 },
    { time: '07:55 AM', type: 'sale', desc: 'Sale Invoice SAL-006', party: 'Balaji Medical Stores', amount: 18900 },
    { time: 'Yesterday', type: 'purchase', desc: 'Purchase PUR-003', party: 'Alkem Laboratories CFA', amount: 89320 },
    { time: 'Yesterday', type: 'payment', desc: 'Supplier Payment', party: 'Sun Pharma CFA Mumbai', amount: 50000 },
];
// Ledger entries for Customer Ledger (Balaji Medical Stores)
exports.customerLedger = {
    customerId: 1,
    customerName: 'Balaji Medical Stores',
    openingBalance: 8500,
    entries: [
        { date: '2025-07-01', desc: 'Opening Balance', voucherNo: 'OB', debit: 8500, credit: 0, balance: 8500 },
        { date: '2025-07-10', desc: 'Sales Invoice', voucherNo: 'SAL-001', debit: 14250, credit: 0, balance: 22750 },
        { date: '2025-07-15', desc: 'Payment Received', voucherNo: 'RCP-001', debit: 0, credit: 12000, balance: 10750 },
        { date: '2025-07-20', desc: 'Sales Invoice', voucherNo: 'SAL-006', debit: 18900, credit: 0, balance: 29650 },
    ],
    closingBalance: 29650,
};
// Admin portal - companies data
exports.adminCompanies = [
    {
        id: 1, name: 'Sharma Medical Distributors Pvt. Ltd.',
        city: 'Mumbai', state: 'Maharashtra',
        gstin: '27AABCS1429B1Z6', drugLicense: 'MH-2024-DL-001423',
        registeredOn: '2025-01-15', plan: 'Annual',
        status: 'active', lastLogin: '2 hours ago',
        lastBackup: '2025-07-21 06:00 AM', totalInvoices: 1240, dbSize: '45 MB',
    },
    {
        id: 2, name: 'Gupta Pharma Wholesale Pvt. Ltd.',
        city: 'Pune', state: 'Maharashtra',
        gstin: '27AAAPG9876C1Z2', drugLicense: 'MH-2023-DL-009871',
        registeredOn: '2025-02-20', plan: 'Annual',
        status: 'active', lastLogin: '5 hours ago',
        lastBackup: '2025-07-21 06:00 AM', totalInvoices: 890, dbSize: '32 MB',
    },
    {
        id: 3, name: 'Patel Medico Distributors',
        city: 'Ahmedabad', state: 'Gujarat',
        gstin: '24AADCP5678D1Z8', drugLicense: 'GJ-2022-DL-005432',
        registeredOn: '2025-03-10', plan: 'Semi-Annual',
        status: 'active', lastLogin: '1 day ago',
        lastBackup: '2025-07-20 06:00 AM', totalInvoices: 654, dbSize: '28 MB',
    },
    {
        id: 4, name: 'Ravi Medical Agencies',
        city: 'Hyderabad', state: 'Telangana',
        gstin: '36AAARR1234E1Z5', drugLicense: 'TS-2023-DL-003219',
        registeredOn: '2025-04-05', plan: 'Trial',
        status: 'active', lastLogin: '3 days ago',
        lastBackup: '2025-07-18 06:00 AM', totalInvoices: 125, dbSize: '8 MB',
    },
    {
        id: 5, name: 'Suresh Pharma Distributors',
        city: 'Chennai', state: 'Tamil Nadu',
        gstin: '33AABCS5678F1Z1', drugLicense: 'TN-2021-DL-008765',
        registeredOn: '2024-11-01', plan: 'Annual',
        status: 'inactive', lastLogin: '45 days ago',
        lastBackup: '2025-06-05 06:00 AM', totalInvoices: 2340, dbSize: '86 MB',
    },
    {
        id: 6, name: 'Anand Medicals Pvt. Ltd.',
        city: 'Nagpur', state: 'Maharashtra',
        gstin: '27AAAAA2345G1Z9', drugLicense: 'MH-2024-DL-007654',
        registeredOn: '2025-05-15', plan: 'Annual',
        status: 'active', lastLogin: '6 hours ago',
        lastBackup: '2025-07-21 06:00 AM', totalInvoices: 432, dbSize: '18 MB',
    },
];
exports.adminActivityLogs = [
    { id: 1, company: 'Sharma Medical Distributors', action: 'Sale Invoice Created', details: 'SAL-007 • ₹31,200', time: '08:42 AM', date: 'Today', type: 'sale' },
    { id: 2, company: 'Gupta Pharma Wholesale', action: 'Purchase Entry Saved', details: 'PUR-018 • ₹1,24,500', time: '08:30 AM', date: 'Today', type: 'purchase' },
    { id: 3, company: 'Sharma Medical Distributors', action: 'Receipt Recorded', details: 'RCP-012 • ₹35,000', time: '08:15 AM', date: 'Today', type: 'receipt' },
    { id: 4, company: 'Anand Medicals Pvt. Ltd.', action: 'User Login', details: 'Admin login', time: '07:55 AM', date: 'Today', type: 'login' },
    { id: 5, company: 'Patel Medico Distributors', action: 'Backup Completed', details: 'Automatic • 28 MB', time: '06:00 AM', date: 'Today', type: 'backup' },
    { id: 6, company: 'Gupta Pharma Wholesale', action: 'Sale Invoice Created', details: 'SAL-045 • ₹42,000', time: '05:30 PM', date: 'Yesterday', type: 'sale' },
    { id: 7, company: 'Sharma Medical Distributors', action: 'Product Master Updated', details: 'Crocin 500mg edited', time: '03:10 PM', date: 'Yesterday', type: 'master' },
];
exports.salesmen = ['Ramesh Kumar', 'Suresh Patil', 'Mahesh Joshi', 'Deepak Sharma'];
exports.areas = ['Dadar', 'Parel', 'Kurla', 'Bandra', 'Ghatkopar', 'Andheri', 'Borivali', 'Thane'];
exports.paymentModes = ['Cash', 'Cheque', 'NEFT/RTGS', 'UPI', 'Credit Card'];
exports.gstRates = [0, 5, 12, 18];
exports.gstTypes = ['Exclusive', 'Inclusive'];
exports.returnReasons = ['Near Expiry', 'Expired', 'Damaged', 'Wrong Product', 'Excess Supply', 'Quality Issue'];
exports.adjustmentReasons = ['Physical Count', 'Damage', 'Lost/Theft', 'Expired Destroyed', 'Other'];
