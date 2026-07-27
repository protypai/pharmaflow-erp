"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Sales;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const react_router_dom_1 = require("react-router-dom");
const dataService_1 = require("../../services/dataService");
function Sales() {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const [customerId, setCustomerId] = (0, react_1.useState)('');
    const [customerWarning, setCustomerWarning] = (0, react_1.useState)(null);
    const [rows, setRows] = (0, react_1.useState)([
        { id: 1, product: '', productName: '', productSearch: '', batch: '', expiry: '', qty: 0, free: 0, unit: 'box', boxSize: 10, available: 0, baseAvailable: 0, rate: 0, baseRate: 0, mrp: 0, baseMrp: 0, disc: 0, gst: 12, amount: 0, batchId: '' }
    ]);
    const [activeRowSearch, setActiveRowSearch] = (0, react_1.useState)(null);
    const [totals, setTotals] = (0, react_1.useState)({ sub: 0, disc: 0, gst: 0, net: 0 });
    const [customersList, setCustomersList] = (0, react_1.useState)([]);
    const [productsList, setProductsList] = (0, react_1.useState)([]);
    const [invoiceNo, setInvoiceNo] = (0, react_1.useState)('');
    const [invoiceDate, setInvoiceDate] = (0, react_1.useState)(new Date().toISOString().split('T')[0]);
    const [doctorName, setDoctorName] = (0, react_1.useState)('');
    const [paymentMode, setPaymentMode] = (0, react_1.useState)('Credit');
    const [errorMsg, setErrorMsg] = (0, react_1.useState)('');
    const [successMsg, setSuccessMsg] = (0, react_1.useState)('');
    const [isSaving, setIsSaving] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const fetchMasterData = async () => {
            try {
                try {
                    await window.pharmaAPI.db.run("ALTER TABLE sale_items ADD COLUMN free_qty REAL DEFAULT 0;");
                }
                catch (e) { }
                const custRes = await window.pharmaAPI.db.query("SELECT id, name, area, credit_limit, opening_balance FROM customers ORDER BY name ASC");
                setCustomersList(custRes?.data || []);
                const prodRes = await window.pharmaAPI.db.query(`
          SELECT p.id as product_id, p.name as product_name, p.gst_rate, p.packing, p.conversion_factor,
                 b.id as batch_id, b.batch_no, b.expiry_date, b.mrp, b.ptr, b.current_qty as available
          FROM products p
          JOIN batches b ON p.id = b.product_id
          WHERE b.current_qty > 0
          ORDER BY p.name ASC, b.expiry_date ASC
        `);
                const prodMap = {};
                if (prodRes?.data) {
                    prodRes.data.forEach(row => {
                        if (!prodMap[row.product_id]) {
                            prodMap[row.product_id] = {
                                id: row.product_id,
                                name: row.product_name,
                                gst: row.gst_rate,
                                boxSize: (row.conversion_factor && Number(row.conversion_factor) > 0) ? Number(row.conversion_factor) : 10,
                                batches: []
                            };
                        }
                        prodMap[row.product_id].batches.push({
                            id: row.batch_id,
                            batch: row.batch_no,
                            expiry: row.expiry_date,
                            mrp: row.mrp,
                            ptr: row.ptr,
                            qty: row.available
                        });
                    });
                }
                setProductsList(Object.values(prodMap));
            }
            catch (err) {
                console.error('Failed to load master data for sales:', err);
                setErrorMsg('Failed to load customers/products from database.');
            }
        };
        fetchMasterData();
        // Auto-generate invoice number based on timestamp for simplicity
        setInvoiceNo('INV-' + Date.now().toString().slice(-6));
    }, []);
    // Handle Customer Selection
    (0, react_1.useEffect)(() => {
        if (customerId) {
            const cust = customersList.find(c => c.id === customerId);
            if (cust) {
                // In a real app we'd calculate current outstanding via queries, using opening balance here roughly
                if (cust.opening_balance > cust.credit_limit) {
                    setCustomerWarning(`Credit Limit Exceeded! Outstanding: ₹${cust.opening_balance} (Limit: ₹${cust.credit_limit})`);
                }
                else {
                    setCustomerWarning(null);
                }
            }
        }
        else {
            setCustomerWarning(null);
        }
    }, [customerId, customersList]);
    // Handle Row Calculations
    (0, react_1.useEffect)(() => {
        let sub = 0;
        let totalDisc = 0;
        let totalGst = 0;
        const newRows = rows.map(r => {
            const baseAmt = (Number(r.qty) || 0) * (Number(r.rate) || 0);
            const rowDisc = baseAmt * ((Number(r.disc) || 0) / 100);
            const taxable = baseAmt - rowDisc;
            const gstAmt = taxable * ((Number(r.gst) || 0) / 100);
            const rowNet = taxable + gstAmt;
            sub += baseAmt;
            totalDisc += rowDisc;
            totalGst += gstAmt;
            return { ...r, amount: rowNet };
        });
        const hasChanged = newRows.some((r, i) => Math.abs(r.amount - rows[i].amount) > 0.01);
        if (hasChanged)
            setRows(newRows);
        setTotals({
            sub,
            disc: totalDisc,
            gst: totalGst,
            net: Math.round(sub - totalDisc + totalGst)
        });
    }, [rows]);
    const addRow = () => {
        setRows([...rows, { id: Date.now(), product: '', productName: '', productSearch: '', batch: '', expiry: '', qty: 0, free: 0, unit: 'box', boxSize: 10, available: 0, baseAvailable: 0, rate: 0, baseRate: 0, mrp: 0, baseMrp: 0, disc: 0, gst: 12, amount: 0, batchId: '' }]);
    };
    const selectProduct = (id, prod) => {
        setRows(rows.map(r => {
            if (r.id === id) {
                return {
                    ...r,
                    product: prod.id,
                    productName: prod.name,
                    productSearch: prod.name,
                    gst: prod.gst ?? 12,
                    boxSize: prod.boxSize || 10,
                    batch: '',
                    batchId: '',
                    expiry: '',
                    available: 0,
                    baseAvailable: 0,
                    rate: 0,
                    baseRate: 0,
                    mrp: 0,
                    baseMrp: 0
                };
            }
            return r;
        }));
        setActiveRowSearch(null);
    };
    const updateRow = (id, field, value) => {
        setRows(rows.map(r => {
            if (r.id !== id)
                return r;
            let updated = { ...r, [field]: value };
            if (field === 'productSearch') {
                updated.product = '';
                updated.productName = '';
                updated.batch = '';
                updated.batchId = '';
                updated.expiry = '';
                updated.available = 0;
                updated.baseAvailable = 0;
                updated.rate = 0;
                updated.mrp = 0;
            }
            if (field === 'batch' && r.product) {
                const prod = productsList.find(p => p.id === r.product);
                if (prod) {
                    const batchData = prod.batches.find(b => b.batch === value);
                    if (batchData) {
                        updated.batchId = batchData.id;
                        updated.expiry = batchData.expiry;
                        updated.baseAvailable = Number(batchData.qty);
                        updated.baseMrp = Number(batchData.mrp);
                        updated.baseRate = Number(batchData.mrp);
                        const factor = Number(updated.boxSize) || 10;
                        if (updated.unit === 'box') {
                            updated.available = Number(batchData.qty);
                            updated.mrp = Number((batchData.mrp * factor).toFixed(2));
                            updated.rate = Number((batchData.mrp * factor).toFixed(2));
                        }
                        else {
                            updated.available = Number((batchData.qty * factor).toFixed(1));
                            updated.mrp = Number(batchData.mrp);
                            updated.rate = Number(batchData.mrp);
                        }
                    }
                }
            }
            if (field === 'unit') {
                const oldUnit = r.unit || 'box';
                const newUnit = value;
                const factor = Number(updated.boxSize) || 10;
                if (oldUnit === 'box' && newUnit === 'strip') {
                    updated.rate = Number((r.baseRate || 0).toFixed(2));
                    updated.mrp = Number((r.baseMrp || 0).toFixed(2));
                    updated.available = Number(((r.baseAvailable ?? r.available) * factor).toFixed(1));
                }
                else if (oldUnit === 'strip' && newUnit === 'box') {
                    updated.rate = Number(((r.baseRate || 0) * factor).toFixed(2));
                    updated.mrp = Number(((r.baseMrp || 0) * factor).toFixed(2));
                    updated.available = Number(r.baseAvailable ?? (r.available / factor));
                }
            }
            if (field === 'boxSize') {
                const newFactor = Number(value) || 10;
                if (r.unit === 'box') {
                    updated.rate = Number(((r.baseRate || 0) * newFactor).toFixed(2));
                    updated.mrp = Number(((r.baseMrp || 0) * newFactor).toFixed(2));
                    updated.available = r.baseAvailable || r.available;
                }
                else {
                    updated.rate = Number(r.baseRate || 0);
                    updated.mrp = Number(r.baseMrp || 0);
                    updated.available = Number(((r.baseAvailable ?? 0) * newFactor).toFixed(1));
                }
            }
            return updated;
        }));
    };
    const removeRow = (id) => {
        if (rows.length > 1) {
            setRows(rows.filter(r => r.id !== id));
        }
    };
    const handleSave = async () => {
        setErrorMsg('');
        setSuccessMsg('');
        if (!customerId || !invoiceNo || !invoiceDate) {
            setErrorMsg("Customer, Invoice No, and Invoice Date are required.");
            return;
        }
        const validRows = rows.filter(r => r.product && r.batch && Number(r.qty) > 0 && Number(r.rate) > 0);
        if (validRows.length === 0) {
            setErrorMsg("Please add at least one valid product row with Batch, Qty, and Rate.");
            return;
        }
        // Validate overstock
        for (const row of validRows) {
            const isBox = row.unit === 'box';
            const packMultiplier = Number(row.boxSize) || 10;
            const totalBoxesNeeded = isBox
                ? (Number(row.qty || 0) + Number(row.free || 0))
                : (Number(row.qty || 0) + Number(row.free || 0)) / packMultiplier;
            const availBoxes = row.baseAvailable ?? (isBox ? row.available : row.available / packMultiplier);
            if (totalBoxesNeeded > availBoxes) {
                setErrorMsg(`Total quantity (${isBox ? totalBoxesNeeded + ' Boxes' : (Number(row.qty || 0) + Number(row.free || 0)) + ' Strips'}) for batch ${row.batch} exceeds available stock (${availBoxes} Boxes).`);
                return;
            }
        }
        setIsSaving(true);
        try {
            try {
                await window.pharmaAPI.db.run("ALTER TABLE sale_items ADD COLUMN free_qty REAL DEFAULT 0;");
            }
            catch (e) { }
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userRes = await window.pharmaAPI.db.query("SELECT company_id FROM users WHERE id = ? OR email = ?", [user.id || '', user.email || '']);
            if (!userRes?.data?.length)
                throw new Error("Admin user not found in local DB");
            const companyId = userRes.data[0].company_id;
            const saleId = 'SAL-' + Date.now();
            const operations = [];
            // 1. Insert into sales
            operations.push({
                sql: `INSERT INTO sales (
          id, company_id, invoice_no, customer_id, date, salesman, gst_type,
          subtotal, discount_amount, taxable_amount, net_amount, payment_mode, paid_amount, notes, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', datetime('now'), datetime('now'))`,
                params: [
                    saleId, companyId, invoiceNo, customerId, invoiceDate, user.name || 'Admin', 'exclusive',
                    totals.sub, totals.disc, totals.sub - totals.disc, totals.net, paymentMode, paymentMode === 'Credit' ? 0 : totals.net, doctorName ? 'Doctor: ' + doctorName : null
                ]
            });
            // Insert receipt if not credit
            let receiptId = null;
            let pModeNormalized = null;
            let receiptNo = null;
            if (paymentMode !== 'Credit') {
                pModeNormalized = paymentMode === 'Cash' ? 'cash' : 'bank';
                receiptId = 'REC-' + Date.now();
                receiptNo = 'RCT-' + Date.now().toString().slice(-6);
                operations.push({
                    sql: `INSERT INTO receipts (
            id, company_id, receipt_no, customer_id, date, amount, payment_mode, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                    params: [
                        receiptId, companyId, receiptNo, customerId, invoiceDate, totals.net, pModeNormalized, 'Against Sale ' + invoiceNo
                    ]
                });
            }
            // 2. Insert items and update batches
            const syncItems = []; // Collect sync payloads to run after db transaction
            for (const row of validRows) {
                const isBox = row.unit === 'box';
                const packMultiplier = Number(row.boxSize) || 10;
                const billedBoxes = isBox ? Number(row.qty || 0) : Number(row.qty || 0) / packMultiplier;
                const freeBoxes = isBox ? Number(row.free || 0) : Number(row.free || 0) / packMultiplier;
                const totalDeductBoxes = billedBoxes + freeBoxes;
                const stripRate = isBox ? Number(row.rate || 0) / packMultiplier : Number(row.rate || 0);
                const stripMrp = isBox ? Number(row.mrp || 0) / packMultiplier : Number(row.mrp || 0);
                const availBoxes = row.baseAvailable ?? (isBox ? row.available : row.available / packMultiplier);
                // Deduct from Batch
                operations.push({
                    sql: `UPDATE batches SET 
            current_qty = current_qty - ?, 
            updated_at = datetime('now') 
            WHERE id = ?`,
                    params: [totalDeductBoxes, row.batchId]
                });
                syncItems.push({
                    tableName: 'Batch',
                    operation: 'update',
                    payload: { id: row.batchId, currentQty: availBoxes - totalDeductBoxes }
                });
                // Insert Sale Item
                const saleItemId = 'S-ITM-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
                operations.push({
                    sql: `INSERT INTO sale_items (
            id, sale_id, product_id, batch_id, qty, free_qty, mrp, ptr, sale_price, disc_percent, gst_rate, net_amount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    params: [
                        saleItemId,
                        saleId, row.product, row.batchId, billedBoxes, freeBoxes, stripMrp, stripRate, stripRate, Number(row.disc || 0), Number(row.gst || 0), row.amount
                    ]
                });
                syncItems.push({
                    tableName: 'SaleItem',
                    operation: 'create',
                    payload: {
                        id: saleItemId,
                        saleId,
                        productId: row.product,
                        batchId: row.batchId,
                        qty: billedBoxes,
                        freeQty: freeBoxes,
                        mrp: stripMrp,
                        ptr: stripRate,
                        salePrice: stripRate,
                        discPercent: Number(row.disc || 0),
                        gstRate: Number(row.gst || 0),
                        netAmount: row.amount
                    }
                });
            }
            const res = await window.pharmaAPI.db.transaction(operations);
            if (!res.success) {
                throw new Error(res.error || 'Transaction failed');
            }
            const mapPaymentMode = (pm) => {
                if (pm === 'Cash')
                    return 'cash';
                if (pm === 'Credit')
                    return 'credit';
                return 'upi'; // For Bank / UPI
            };
            const mappedPm = mapPaymentMode(paymentMode);
            // Sync to cloud after successful transaction
            await (0, dataService_1.syncEntity)('Sale', 'create', {
                id: saleId,
                companyId,
                invoiceNo,
                customerId,
                date: new Date(invoiceDate).toISOString(),
                salesman: user.name || 'Admin',
                gstType: 'exclusive',
                subtotal: totals.sub,
                discountAmount: totals.disc,
                taxableAmount: totals.sub - totals.disc,
                netAmount: totals.net,
                paymentMode: mappedPm,
                paidAmount: paymentMode === 'Credit' ? 0 : totals.net,
                notes: doctorName ? 'Doctor: ' + doctorName : null,
                status: 'completed'
            });
            if (paymentMode !== 'Credit') {
                await (0, dataService_1.syncEntity)('Receipt', 'create', {
                    id: receiptId,
                    companyId,
                    receiptNo,
                    customerId,
                    date: new Date(invoiceDate).toISOString(),
                    amount: totals.net,
                    paymentMode: mappedPm === 'cash' ? 'cash' : 'upi',
                    notes: 'Against Sale ' + invoiceNo
                });
            }
            for (const item of syncItems) {
                await (0, dataService_1.syncEntity)(item.tableName, item.operation, item.payload);
            }
            setSuccessMsg(`Sales Invoice ${invoiceNo} saved successfully!`);
            // Reset form
            setCustomerId('');
            setInvoiceNo('INV-' + Date.now().toString().slice(-6));
            setDoctorName('');
            setRows([{ id: Date.now(), product: '', productName: '', productSearch: '', batch: '', expiry: '', qty: 0, free: 0, unit: 'box', boxSize: 10, available: 0, baseAvailable: 0, rate: 0, baseRate: 0, mrp: 0, baseMrp: 0, disc: 0, gst: 12, amount: 0, batchId: '' }]);
            // Re-fetch master data to update available stock levels
            const prodRes = await window.pharmaAPI.db.query(`
        SELECT p.id as product_id, p.name as product_name, p.gst_rate, p.packing, p.conversion_factor,
               b.id as batch_id, b.batch_no, b.expiry_date, b.mrp, b.ptr, b.current_qty as available
        FROM products p
        JOIN batches b ON p.id = b.product_id
        WHERE b.current_qty > 0
        ORDER BY p.name ASC, b.expiry_date ASC
      `);
            const prodMap = {};
            if (prodRes?.data) {
                prodRes.data.forEach(row => {
                    if (!prodMap[row.product_id]) {
                        prodMap[row.product_id] = {
                            id: row.product_id,
                            name: row.product_name,
                            gst: row.gst_rate,
                            boxSize: (row.conversion_factor && Number(row.conversion_factor) > 0) ? Number(row.conversion_factor) : 10,
                            batches: []
                        };
                    }
                    prodMap[row.product_id].batches.push({
                        id: row.batch_id, batch: row.batch_no, expiry: row.expiry_date, mrp: row.mrp, ptr: row.ptr, qty: row.available
                    });
                });
            }
            setProductsList(Object.values(prodMap));
        }
        catch (err) {
            console.error("Sales save error:", err);
            setErrorMsg("Failed to save sales invoice: " + err.message);
        }
        finally {
            setIsSaving(false);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "page-header", style: { marginBottom: 0 }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "page-title", children: "Sales Invoice (Outward)" }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", children: "Generate bills for medical shops and clinics" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", onClick: () => navigate('/transactions/sales'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeft, { size: 16 }), " Back"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", onClick: () => window.print(), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { size: 16 }), " Print"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-primary", onClick: handleSave, disabled: isSaving, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Save, { size: 16 }), " ", isSaving ? 'Saving...' : 'Save & Generate Bill'] })] })] }), errorMsg && ((0, jsx_runtime_1.jsxs)("div", { style: { background: '#fee2e2', border: '1px solid #f87171', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { size: 18 }), " ", (0, jsx_runtime_1.jsx)("strong", { children: "Error:" }), " ", errorMsg] })), successMsg && ((0, jsx_runtime_1.jsxs)("div", { style: { background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '0.75rem 1rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)("strong", { children: "Success:" }), " ", successMsg] })), customerWarning && !errorMsg && !successMsg && ((0, jsx_runtime_1.jsxs)("div", { style: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { size: 18 }), (0, jsx_runtime_1.jsx)("span", { style: { fontWeight: 600 }, children: customerWarning }), " - Proceed with caution."] })), (0, jsx_runtime_1.jsx)("div", { className: "card", children: (0, jsx_runtime_1.jsx)("div", { className: "card-body", children: (0, jsx_runtime_1.jsxs)("div", { className: "form-row-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Customer ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: customerId, onChange: e => setCustomerId(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select Customer..." }), customersList.map(c => (0, jsx_runtime_1.jsxs)("option", { value: c.id, children: [c.name, " (", c.area, ")"] }, c.id))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Invoice Date" }), (0, jsx_runtime_1.jsx)("input", { type: "date", className: "form-input", value: invoiceDate, onChange: e => setInvoiceDate(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Doctor Name (Optional)" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", placeholder: "Prescribing doctor...", value: doctorName, onChange: e => setDoctorName(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Payment Mode" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: paymentMode, onChange: e => setPaymentMode(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "Credit", children: "Credit" }), (0, jsx_runtime_1.jsx)("option", { value: "Cash", children: "Cash" }), (0, jsx_runtime_1.jsx)("option", { value: "Bank / UPI", children: "Bank / UPI" })] })] })] }) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [(0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", style: { minWidth: '1100px' }, children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { style: { width: '220px' }, children: "Product" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '130px' }, children: "Batch (FEFO)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '75px' }, children: "Expiry" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '110px' }, children: "Available" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '130px' }, children: "Bill Qty & Unit" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '70px' }, children: "Free" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '85px' }, children: "Rate (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '85px' }, children: "MRP (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '65px' }, children: "Disc%" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '70px' }, children: "GST%" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '90px', textAlign: 'right' }, children: "Amount (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '40px' } })] }) }), (0, jsx_runtime_1.jsxs)("tbody", { children: [rows.map((r) => {
                                            const prod = productsList.find(p => p.id === r.product);
                                            const isBox = r.unit === 'box';
                                            const packMultiplier = Number(r.boxSize) || 10;
                                            const totalBoxesNeeded = isBox ? (Number(r.qty || 0) + Number(r.free || 0)) : (Number(r.qty || 0) + Number(r.free || 0)) / packMultiplier;
                                            const availBoxes = r.baseAvailable ?? (isBox ? r.available : r.available / packMultiplier);
                                            const overStock = totalBoxesNeeded > availBoxes;
                                            const availText = isBox ? `${availBoxes} Boxes (${Number((availBoxes * packMultiplier).toFixed(0))} Strips)` : `${r.available} Strips (${availBoxes} Boxes)`;
                                            return ((0, jsx_runtime_1.jsxs)("tr", { style: { background: overStock ? '#FEF2F2' : 'transparent' }, children: [(0, jsx_runtime_1.jsxs)("td", { style: { position: 'relative' }, children: [(0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input form-input-sm", placeholder: "Type to search product...", value: r.productSearch ?? '', onFocus: () => setActiveRowSearch(r.id), onChange: e => updateRow(r.id, 'productSearch', e.target.value) }), activeRowSearch === r.id && ((0, jsx_runtime_1.jsxs)("div", { style: {
                                                                    position: 'absolute', top: '100%', left: 0, width: '300px',
                                                                    background: '#fff', border: '1px solid var(--border)', borderRadius: '4px',
                                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 50, maxHeight: '200px', overflowY: 'auto'
                                                                }, children: [productsList
                                                                        .filter(p => !r.productSearch || p.name.toLowerCase().includes(r.productSearch.toLowerCase()))
                                                                        .slice(0, 20)
                                                                        .map(p => ((0, jsx_runtime_1.jsxs)("div", { style: { padding: '6px 10px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '13px' }, onMouseDown: (e) => { e.preventDefault(); selectProduct(r.id, p); }, onMouseEnter: (e) => e.target.style.background = '#f8fafc', onMouseLeave: (e) => e.target.style.background = '#fff', children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 500 }, children: p.name }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '11px', color: 'var(--text-secondary)' }, children: ["In Stock: ", p.batches.reduce((sum, b) => sum + Number(b.qty), 0), " Boxes (", p.batches.length, " batches)"] })] }, p.id))), productsList.filter(p => !r.productSearch || p.name.toLowerCase().includes(r.productSearch.toLowerCase())).length === 0 && ((0, jsx_runtime_1.jsx)("div", { style: { padding: '8px', color: '#94a3b8', fontSize: '12px', textAlign: 'center' }, children: "No available stock found" }))] }))] }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("select", { className: "form-select form-input-sm", value: r.batch, onChange: e => updateRow(r.id, 'batch', e.target.value), disabled: !r.product, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select Batch" }), prod && prod.batches.map(b => ((0, jsx_runtime_1.jsxs)("option", { value: b.batch, children: [b.batch, " (", b.qty, " Boxes)"] }, b.id)))] }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input form-input-sm", value: r.expiry, readOnly: true, style: { background: '#F8FAFC' } }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input form-input-sm", value: availText, readOnly: true, style: { background: '#F8FAFC', color: availBoxes === 0 ? 'var(--danger)' : 'inherit', fontSize: '11px', fontWeight: 600 } }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '3px' }, children: [(0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", min: "1", value: r.qty === 0 ? '' : r.qty, onChange: e => updateRow(r.id, 'qty', e.target.value), style: { borderColor: overStock ? 'var(--danger)' : 'var(--border)', fontWeight: 600 } }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '2px', alignItems: 'center' }, children: [(0, jsx_runtime_1.jsxs)("select", { className: "form-select form-input-sm", value: r.unit || 'box', onChange: e => updateRow(r.id, 'unit', e.target.value), style: { padding: '1px 4px', height: '22px', fontSize: '11px', background: '#f8fafc', flex: 1 }, children: [(0, jsx_runtime_1.jsx)("option", { value: "box", children: "Per Box" }), (0, jsx_runtime_1.jsx)("option", { value: "strip", children: "Per Strip" })] }), r.unit === 'box' && ((0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", min: "1", title: "Units per Box", value: r.boxSize || 10, onChange: e => updateRow(r.id, 'boxSize', e.target.value), style: { width: '40px', padding: '1px 2px', height: '22px', fontSize: '11px', textAlign: 'center' } }))] })] }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '3px' }, children: [(0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", min: "0", placeholder: "0", value: r.free === 0 ? '' : r.free, onChange: e => updateRow(r.id, 'free', e.target.value) }), (0, jsx_runtime_1.jsx)("span", { style: { fontSize: '10px', color: '#64748b', textAlign: 'center' }, children: r.unit === 'box' ? 'Boxes' : 'Strips' })] }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", min: "0", step: "0.01", value: r.rate === 0 ? '' : r.rate, onChange: e => updateRow(r.id, 'rate', e.target.value) }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", value: r.mrp === 0 ? '' : r.mrp, readOnly: true, style: { background: '#F8FAFC' } }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", min: "0", step: "0.01", value: r.disc === 0 ? '' : r.disc, onChange: e => updateRow(r.id, 'disc', e.target.value) }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", value: r.gst, readOnly: true, style: { background: '#F8FAFC' } }) }), (0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 600, textAlign: 'right' }, children: r.amount.toFixed(2) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost btn-sm", onClick: () => removeRow(r.id), style: { color: 'var(--danger)', padding: '0.25rem' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { size: 16 }) }) })] }, r.id));
                                        }), (0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: "12", children: (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-ghost btn-sm", onClick: addRow, style: { color: 'var(--primary)' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { size: 16 }), " Add Product Row"] }) }) })] })] }) }), (0, jsx_runtime_1.jsx)("div", { style: { padding: '1rem', borderTop: '1px solid var(--border)', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end' }, children: (0, jsx_runtime_1.jsxs)("div", { style: { width: '300px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Gross Total:" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["\u20B9 ", totals.sub.toFixed(2)] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Total Discount:" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["- \u20B9 ", totals.disc.toFixed(2)] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Total Tax (GST):" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["+ \u20B9 ", totals.gst.toFixed(2)] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Net Bill Amount:" }), " ", (0, jsx_runtime_1.jsxs)("span", { style: { color: 'var(--primary)' }, children: ["\u20B9 ", totals.net.toFixed(2)] })] })] }) })] })] }));
}
