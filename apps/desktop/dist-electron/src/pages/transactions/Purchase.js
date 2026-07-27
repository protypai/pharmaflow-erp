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
exports.default = Purchase;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const react_router_dom_1 = require("react-router-dom");
const dataService_1 = require("../../services/dataService");
function Purchase() {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const [rows, setRows] = (0, react_1.useState)([
        { id: 1, product: '', productName: '', productSearch: '', batch: '', expiry: '', qty: 0, invPrice: 0, priceUnit: 'strip', boxSize: 10, pts: 0, ptr: 0, mrp: 0, disc: 0, gst: 12, amount: 0, effectiveUnitPrice: 0 }
    ]);
    const [activeRowSearch, setActiveRowSearch] = (0, react_1.useState)(null);
    const [totals, setTotals] = (0, react_1.useState)({ sub: 0, disc: 0, gst: 0, net: 0 });
    const [supplierId, setSupplierId] = (0, react_1.useState)('');
    const [invoiceNo, setInvoiceNo] = (0, react_1.useState)('');
    const [invoiceDate, setInvoiceDate] = (0, react_1.useState)(new Date().toISOString().split('T')[0]);
    const [gstType, setGstType] = (0, react_1.useState)('Local (CGST + SGST) - Exclusive');
    const [paymentMode, setPaymentMode] = (0, react_1.useState)('Credit');
    const [suppliersList, setSuppliersList] = (0, react_1.useState)([]);
    const [productsList, setProductsList] = (0, react_1.useState)([]);
    const [errorMsg, setErrorMsg] = (0, react_1.useState)('');
    const [successMsg, setSuccessMsg] = (0, react_1.useState)('');
    const [isSaving, setIsSaving] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const fetchMasterData = async () => {
            try {
                const supRes = await window.pharmaAPI.db.query("SELECT id, name, city FROM suppliers ORDER BY name ASC");
                setSuppliersList(supRes?.data || []);
                const prodRes = await window.pharmaAPI.db.query("SELECT id, name, gst_rate, packing, conversion_factor FROM products ORDER BY name ASC");
                setProductsList(prodRes?.data || []);
            }
            catch (err) {
                console.error('Failed to load master data for purchase:', err);
                setErrorMsg('Failed to load suppliers/products from database.');
            }
        };
        fetchMasterData();
    }, []);
    // Calculate row amounts and totals when rows change
    (0, react_1.useEffect)(() => {
        let sub = 0;
        let totalDisc = 0;
        let totalGst = 0;
        const newRows = rows.map(r => {
            const packMultiplier = (r.priceUnit || 'strip') === 'strip' ? (Number(r.boxSize) || 10) : 1;
            const baseAmt = (Number(r.qty) || 0) * (Number(r.invPrice) || 0) * packMultiplier;
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
            net: Math.round(sub - totalDisc + totalGst) // Round off to nearest rupee
        });
    }, [rows]);
    const addRow = () => {
        setRows([...rows, { id: Date.now(), product: '', productName: '', productSearch: '', batch: '', expiry: '', qty: 0, invPrice: 0, priceUnit: 'strip', boxSize: 10, pts: 0, ptr: 0, mrp: 0, disc: 0, gst: 12, amount: 0, effectiveUnitPrice: 0 }]);
    };
    const selectProduct = (id, prod) => {
        setRows(rows.map(r => {
            if (r.id === id) {
                return {
                    ...r,
                    product: prod.id,
                    productName: prod.name,
                    productSearch: prod.name,
                    gst: prod.gst_rate ?? 12,
                    boxSize: (prod.conversion_factor && Number(prod.conversion_factor) > 0) ? Number(prod.conversion_factor) : 10
                };
            }
            return r;
        }));
        setActiveRowSearch(null);
    };
    const updateRow = (id, field, value) => {
        setRows(rows.map(r => {
            if (r.id === id) {
                let updated = { ...r, [field]: value };
                if (field === 'productSearch') {
                    updated.product = '';
                    updated.productName = '';
                }
                return updated;
            }
            return r;
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
        if (!supplierId || !invoiceNo || !invoiceDate) {
            setErrorMsg("Supplier, Invoice No, and Invoice Date are required.");
            return;
        }
        const validRows = rows.filter(r => r.product && r.batch && Number(r.qty) > 0 && Number(r.mrp) > 0 && Number(r.invPrice) > 0);
        if (validRows.length === 0) {
            setErrorMsg("Please add at least one valid product row with selected Product, Batch, Qty, Invoice Price, and MRP.");
            return;
        }
        setIsSaving(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userRes = await window.pharmaAPI.db.query("SELECT company_id FROM users WHERE id = ? OR email = ?", [user.id || '', user.email || '']);
            if (!userRes?.data?.length)
                throw new Error("Admin user not found in local DB");
            const companyId = userRes.data[0].company_id;
            const purchaseId = 'PUR-' + Date.now();
            const entryNo = 'PE-' + Date.now().toString().slice(-6);
            const operations = [];
            // 1. Insert into purchases
            operations.push({
                sql: `INSERT INTO purchases (
          id, company_id, entry_no, supplier_id, invoice_no, invoice_date, gst_type,
          subtotal, discount_amount, taxable_amount, net_amount, payment_mode, paid_amount, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'saved', datetime('now'), datetime('now'))`,
                params: [
                    purchaseId, companyId, entryNo, supplierId, invoiceNo, invoiceDate, gstType,
                    totals.sub, totals.disc, totals.sub - totals.disc, totals.net, paymentMode, paymentMode === 'Credit' ? 0 : totals.net
                ]
            });
            // Insert payment if not credit
            let paymentId = null;
            let pModeNormalized = null;
            let paymentNo = null;
            if (paymentMode !== 'Credit') {
                pModeNormalized = paymentMode === 'Cash' ? 'cash' : 'bank';
                paymentId = 'PAY-' + Date.now();
                paymentNo = 'PMT-' + Date.now().toString().slice(-6);
                operations.push({
                    sql: `INSERT INTO payments (
            id, company_id, payment_no, supplier_id, date, amount, payment_mode, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                    params: [
                        paymentId, companyId, paymentNo, supplierId, invoiceDate, totals.net, pModeNormalized, 'Against Purchase ' + invoiceNo
                    ]
                });
            }
            const syncItems = [];
            // 2. Insert items and update batches
            for (const row of validRows) {
                const batchId = 'BCH-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
                const isBox = (row.priceUnit || 'strip') === 'box';
                const packMultiplier = Number(row.boxSize) || 10;
                // Database current_qty always records Boxes
                const stockQty = Number(row.qty) || 0;
                // Database prices always record Price per Strip
                const unitPurchasePrice = isBox ? Number(((Number(row.invPrice) || 0) / packMultiplier).toFixed(2)) : Number(row.invPrice) || 0;
                const saveMrp = isBox ? Number(((Number(row.mrp) || 0) / packMultiplier).toFixed(2)) : Number(row.mrp) || 0;
                const savePtr = isBox ? Number(((Number(row.ptr) || 0) / packMultiplier).toFixed(2)) : Number(row.ptr) || 0;
                const savePts = isBox ? Number(((Number(row.pts) || 0) / packMultiplier).toFixed(2)) : Number(row.pts) || 0;
                // Upsert Batch
                operations.push({
                    sql: `INSERT INTO batches (
            id, product_id, batch_no, expiry_date, mrp, ptr, pts, purchase_price, gst_rate, current_qty, free_qty, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
          ON CONFLICT(product_id, batch_no) DO UPDATE SET 
            current_qty = current_qty + excluded.current_qty,
            mrp = excluded.mrp,
            ptr = excluded.ptr,
            pts = excluded.pts,
            purchase_price = excluded.purchase_price,
            updated_at = datetime('now')`,
                    params: [
                        batchId, row.product, row.batch, row.expiry || '12/99', saveMrp, savePtr, savePts, unitPurchasePrice, Number(row.gst) || 0, stockQty
                    ]
                });
                syncItems.push({
                    tableName: 'Batch',
                    operation: 'create',
                    payload: {
                        id: batchId,
                        productId: row.product,
                        batchNo: row.batch,
                        expiryDate: row.expiry || '12/99',
                        mrp: saveMrp,
                        ptr: savePtr,
                        pts: savePts,
                        purchasePrice: unitPurchasePrice,
                        gstRate: Number(row.gst) || 0,
                        currentQty: stockQty,
                        freeQty: 0
                    }
                });
                // Insert Purchase Item
                const purchaseItemId = 'P-ITM-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
                operations.push({
                    sql: `INSERT INTO purchase_items (
            id, purchase_id, product_id, batch_id, qty, free_qty, purchase_price, ptr, mrp, disc_percent, gst_rate, net_amount
          ) VALUES (?, ?, ?, (SELECT id FROM batches WHERE product_id = ? AND batch_no = ?), ?, 0, ?, ?, ?, ?, ?, ?)`,
                    params: [
                        purchaseItemId,
                        purchaseId,
                        row.product,
                        row.product, row.batch,
                        stockQty, unitPurchasePrice, savePtr, saveMrp, Number(row.disc) || 0, Number(row.gst) || 0, row.amount
                    ]
                });
                syncItems.push({
                    tableName: 'PurchaseItem',
                    operation: 'create',
                    payload: {
                        id: purchaseItemId,
                        purchaseId,
                        productId: row.product,
                        batchId,
                        qty: stockQty,
                        freeQty: 0,
                        purchasePrice: unitPurchasePrice,
                        ptr: savePtr,
                        mrp: saveMrp,
                        discPercent: Number(row.disc) || 0,
                        gstRate: Number(row.gst) || 0,
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
            // Sync to cloud
            await (0, dataService_1.syncEntity)('Purchase', 'create', {
                id: purchaseId,
                companyId,
                entryNo,
                supplierId,
                invoiceNo,
                invoiceDate: new Date(invoiceDate).toISOString(),
                gstType: 'exclusive',
                subtotal: totals.sub,
                discountAmount: totals.disc,
                taxableAmount: totals.sub - totals.disc,
                netAmount: totals.net,
                paymentMode: mappedPm,
                paidAmount: paymentMode === 'Credit' ? 0 : totals.net,
                status: 'saved'
            });
            if (paymentMode !== 'Credit') {
                await (0, dataService_1.syncEntity)('Payment', 'create', {
                    id: paymentId,
                    companyId,
                    paymentNo,
                    supplierId,
                    date: new Date(invoiceDate).toISOString(),
                    amount: totals.net,
                    paymentMode: mappedPm === 'cash' ? 'cash' : 'upi',
                    notes: 'Against Purchase ' + invoiceNo
                });
            }
            for (const item of syncItems) {
                await (0, dataService_1.syncEntity)(item.tableName, item.operation, item.payload);
            }
            setSuccessMsg(`Purchase Invoice ${invoiceNo} saved successfully! Entry No: ${entryNo}`);
            // Reset form
            setSupplierId('');
            setInvoiceNo('');
            setPaymentMode('Credit');
            setRows([{ id: Date.now(), product: '', productName: '', productSearch: '', batch: '', expiry: '', qty: 0, invPrice: 0, priceUnit: 'strip', boxSize: 10, pts: 0, ptr: 0, mrp: 0, disc: 0, gst: 12, amount: 0, effectiveUnitPrice: 0 }]);
        }
        catch (err) {
            console.error("Purchase save error:", err);
            setErrorMsg("Failed to save purchase: " + err.message);
        }
        finally {
            setIsSaving(false);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "page-header", style: { marginBottom: 0 }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "page-title", children: "Purchase Entry (Inward)" }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", children: "Record supplier invoices and update warehouse stock" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", onClick: () => navigate('/transactions/purchases'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeft, { size: 16 }), " Back"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-primary", onClick: handleSave, disabled: isSaving, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Save, { size: 16 }), " ", isSaving ? 'Saving...' : 'Save Purchase Bill'] })] })] }), errorMsg && ((0, jsx_runtime_1.jsxs)("div", { style: { background: '#fee2e2', border: '1px solid #f87171', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { size: 18 }), " ", (0, jsx_runtime_1.jsx)("strong", { children: "Error:" }), " ", errorMsg] })), successMsg && ((0, jsx_runtime_1.jsxs)("div", { style: { background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '0.75rem 1rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)("strong", { children: "Success:" }), " ", successMsg] })), (0, jsx_runtime_1.jsx)("div", { className: "card", children: (0, jsx_runtime_1.jsx)("div", { className: "card-body", children: (0, jsx_runtime_1.jsxs)("div", { className: "form-row-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Supplier / Distributor ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: supplierId, onChange: e => setSupplierId(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select Supplier..." }), suppliersList.map(s => (0, jsx_runtime_1.jsxs)("option", { value: s.id, children: [s.name, " (", s.city, ")"] }, s.id))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Supplier Invoice No ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", placeholder: "e.g. INV-12345", value: invoiceNo, onChange: e => setInvoiceNo(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Invoice Date ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { type: "date", className: "form-input", value: invoiceDate, onChange: e => setInvoiceDate(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Payment Mode" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: paymentMode, onChange: e => setPaymentMode(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "Credit", children: "Credit" }), (0, jsx_runtime_1.jsx)("option", { value: "Cash", children: "Cash" }), (0, jsx_runtime_1.jsx)("option", { value: "Bank / UPI", children: "Bank / UPI" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "GST Type" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: gstType, onChange: e => setGstType(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { children: "Local (CGST + SGST) - Exclusive" }), (0, jsx_runtime_1.jsx)("option", { children: "Interstate (IGST) - Exclusive" }), (0, jsx_runtime_1.jsx)("option", { children: "Local (Inclusive of GST)" })] })] })] }) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [(0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", style: { minWidth: '1350px', overflow: 'visible' }, children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsxs)("th", { style: { width: '230px' }, children: ["Product ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsxs)("th", { style: { width: '90px' }, children: ["Batch ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("th", { style: { width: '75px' }, children: "Expiry" }), (0, jsx_runtime_1.jsxs)("th", { style: { width: '70px' }, children: ["Qty ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsxs)("th", { style: { width: '160px' }, children: ["Invoice Price (\u20B9) ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("th", { style: { width: '85px' }, children: "PTS (\u20B9)" }), (0, jsx_runtime_1.jsxs)("th", { style: { width: '85px' }, children: ["PTR (\u20B9) ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsxs)("th", { style: { width: '85px' }, children: ["MRP (\u20B9) ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("th", { style: { width: '70px' }, children: "Disc %" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '75px' }, children: "GST %" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '100px', textAlign: 'right' }, children: "Net (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '40px' } })] }) }), (0, jsx_runtime_1.jsxs)("tbody", { style: { overflow: 'visible' }, children: [rows.map((r) => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { style: { position: 'relative', overflow: 'visible' }, children: (0, jsx_runtime_1.jsxs)("div", { style: { position: 'relative', width: '100%' }, children: [(0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input form-input-sm", placeholder: "Type to filter product...", value: r.productSearch !== undefined ? r.productSearch : (r.productName || ''), onChange: e => updateRow(r.id, 'productSearch', e.target.value), onFocus: () => setActiveRowSearch(r.id), onBlur: () => setTimeout(() => setActiveRowSearch(null), 200), style: { borderColor: r.product ? 'var(--primary)' : undefined, fontWeight: r.product ? 600 : 400 } }), activeRowSearch === r.id && ((0, jsx_runtime_1.jsxs)("div", { className: "search-dropdown", style: {
                                                                    position: 'absolute', top: 'calc(100% + 2px)', left: 0, width: '280px', zIndex: 9999,
                                                                    background: '#ffffff', border: '1px solid #cbd5e1', maxHeight: '200px', overflowY: 'auto',
                                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: '6px'
                                                                }, children: [productsList
                                                                        .filter(p => !r.productSearch || p.name.toLowerCase().includes((r.productSearch || '').toLowerCase()))
                                                                        .slice(0, 40)
                                                                        .map(p => ((0, jsx_runtime_1.jsxs)("div", { style: { padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, onMouseDown: (e) => {
                                                                            e.preventDefault();
                                                                            selectProduct(r.id, p);
                                                                        }, onMouseEnter: e => e.currentTarget.style.background = '#f8fafc', onMouseLeave: e => e.currentTarget.style.background = '#ffffff', children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 500, color: '#1e293b' }, children: p.name }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '11px', background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }, children: ["GST ", p.gst_rate, "%"] })] }, p.id))), productsList.filter(p => !r.productSearch || p.name.toLowerCase().includes((r.productSearch || '').toLowerCase())).length === 0 && ((0, jsx_runtime_1.jsx)("div", { style: { padding: '10px 12px', color: '#64748b', fontSize: '12px', fontStyle: 'italic', textAlign: 'center' }, children: "No matching products found" }))] }))] }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input form-input-sm", placeholder: "Batch No", value: r.batch, onChange: e => updateRow(r.id, 'batch', e.target.value.toUpperCase()) }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input form-input-sm", placeholder: "MM/YY", value: r.expiry, onChange: e => updateRow(r.id, 'expiry', e.target.value) }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", min: "0", value: r.qty === 0 ? '' : r.qty, onChange: e => updateRow(r.id, 'qty', e.target.value) }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '4px' }, children: [(0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", min: "0", step: "0.01", placeholder: "0.00", value: r.invPrice === 0 ? '' : r.invPrice, onChange: e => updateRow(r.id, 'invPrice', e.target.value), style: { fontWeight: 600, color: 'var(--primary)' } }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '3px', alignItems: 'center' }, children: [(0, jsx_runtime_1.jsxs)("select", { className: "form-select form-input-sm", value: r.priceUnit || 'strip', onChange: e => updateRow(r.id, 'priceUnit', e.target.value), style: { padding: '1px 4px', height: '22px', fontSize: '11px', background: '#f1f5f9', borderRadius: '4px', border: '1px solid #cbd5e1', flex: 1 }, children: [(0, jsx_runtime_1.jsx)("option", { value: "strip", children: "Per Strip/Unit" }), (0, jsx_runtime_1.jsx)("option", { value: "box", children: "Per Box" })] }), (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", min: "1", placeholder: "Strips/Box", title: "Strips per Box", value: r.boxSize === 0 ? '' : r.boxSize, onChange: e => updateRow(r.id, 'boxSize', e.target.value), style: { width: '45px', padding: '1px 4px', height: '22px', fontSize: '11px', textAlign: 'center', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px' } })] })] }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", min: "0", step: "0.01", value: r.pts === 0 ? '' : r.pts, onChange: e => updateRow(r.id, 'pts', e.target.value) }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", min: "0", step: "0.01", value: r.ptr === 0 ? '' : r.ptr, onChange: e => updateRow(r.id, 'ptr', e.target.value) }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", min: "0", step: "0.01", value: r.mrp === 0 ? '' : r.mrp, onChange: e => updateRow(r.id, 'mrp', e.target.value) }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", min: "0", step: "0.01", value: r.disc === 0 ? '' : r.disc, onChange: e => updateRow(r.id, 'disc', e.target.value) }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("select", { className: "form-select form-input-sm", value: r.gst, onChange: e => updateRow(r.id, 'gst', e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "12", children: "12%" }), (0, jsx_runtime_1.jsx)("option", { value: "5", children: "5%" }), (0, jsx_runtime_1.jsx)("option", { value: "18", children: "18%" }), (0, jsx_runtime_1.jsx)("option", { value: "0", children: "0%" }), (0, jsx_runtime_1.jsx)("option", { value: "28", children: "28%" })] }) }), (0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 700, textAlign: 'right', color: 'var(--text-primary)', fontSize: '14px' }, children: r.amount.toFixed(2) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost btn-sm", onClick: () => removeRow(r.id), style: { color: 'var(--danger)', padding: '0.25rem' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { size: 16 }) }) })] }, r.id))), (0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: "12", style: { paddingTop: '1rem' }, children: (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-ghost btn-sm", onClick: addRow, style: { color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { size: 16 }), " Add Another Product Row"] }) }) })] })] }) }), (0, jsx_runtime_1.jsx)("div", { style: { padding: '1rem', borderTop: '1px solid var(--border)', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end' }, children: (0, jsx_runtime_1.jsxs)("div", { style: { width: '300px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Gross Total:" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["\u20B9 ", totals.sub.toFixed(2)] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Total Discount:" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["- \u20B9 ", totals.disc.toFixed(2)] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Total Tax (GST):" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["+ \u20B9 ", totals.gst.toFixed(2)] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Net Payable:" }), " ", (0, jsx_runtime_1.jsxs)("span", { style: { color: 'var(--primary)' }, children: ["\u20B9 ", totals.net.toFixed(2)] })] })] }) })] })] }));
}
