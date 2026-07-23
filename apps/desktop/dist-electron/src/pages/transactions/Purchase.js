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
function Purchase() {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const [rows, setRows] = (0, react_1.useState)([
        { id: 1, product: '', batch: '', expiry: '', qty: 0, free: 0, ptr: 0, mrp: 0, disc1: 0, disc2: 0, gst: 12, amount: 0 }
    ]);
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
                const prodRes = await window.pharmaAPI.db.query("SELECT id, name, gst_rate FROM products ORDER BY name ASC");
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
            const baseAmt = (Number(r.qty) || 0) * (Number(r.ptr) || 0);
            const d1Amt = baseAmt * ((Number(r.disc1) || 0) / 100);
            const d2Amt = (baseAmt - d1Amt) * ((Number(r.disc2) || 0) / 100);
            const rowDisc = d1Amt + d2Amt;
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
        setRows([...rows, { id: Date.now(), product: '', batch: '', expiry: '', qty: 0, free: 0, ptr: 0, mrp: 0, disc1: 0, disc2: 0, gst: 12, amount: 0 }]);
    };
    const updateRow = (id, field, value) => {
        setRows(rows.map(r => {
            if (r.id === id) {
                let updated = { ...r, [field]: value };
                if (field === 'product') {
                    const prod = productsList.find(p => p.id === value);
                    if (prod)
                        updated.gst = prod.gst_rate;
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
        const validRows = rows.filter(r => r.product && r.batch && r.qty > 0 && r.ptr > 0 && r.mrp > 0);
        if (validRows.length === 0) {
            setErrorMsg("Please add at least one valid product row with Batch, Qty, PTR, and MRP.");
            return;
        }
        setIsSaving(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const companyId = user.companyId || 'COMP-DEMO-001';
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
            if (paymentMode !== 'Credit') {
                const pModeNormalized = paymentMode === 'Cash' ? 'cash' : 'bank';
                operations.push({
                    sql: `INSERT INTO payments (
            id, company_id, payment_no, supplier_id, date, amount, payment_mode, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                    params: [
                        'PAY-' + Date.now(), companyId, 'PMT-' + Date.now().toString().slice(-6), supplierId, invoiceDate, totals.net, pModeNormalized, 'Against Purchase ' + invoiceNo
                    ]
                });
            }
            // 2. Insert items and update batches
            for (const row of validRows) {
                const batchId = 'BCH-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
                // Upsert Batch
                operations.push({
                    sql: `INSERT INTO batches (
            id, product_id, batch_no, expiry_date, mrp, ptr, purchase_price, gst_rate, current_qty, free_qty, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          ON CONFLICT(product_id, batch_no) DO UPDATE SET 
            current_qty = current_qty + excluded.current_qty,
            free_qty = free_qty + excluded.free_qty,
            mrp = excluded.mrp,
            ptr = excluded.ptr,
            updated_at = datetime('now')`,
                    params: [
                        batchId, row.product, row.batch, row.expiry || '12/99', row.mrp, row.ptr, row.ptr, row.gst, row.qty, row.free
                    ]
                });
                // Insert Purchase Item (Using a subquery to get the correct batch_id just in case it was updated, or we can use the batchId if it's new. 
                // To be safe, we resolve batch_id using SELECT inside the insert)
                operations.push({
                    sql: `INSERT INTO purchase_items (
            id, purchase_id, product_id, batch_id, qty, free_qty, purchase_price, ptr, mrp, disc_percent, gst_rate, net_amount
          ) VALUES (?, ?, ?, (SELECT id FROM batches WHERE product_id = ? AND batch_no = ?), ?, ?, ?, ?, ?, ?, ?, ?)`,
                    params: [
                        'P-ITM-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                        purchaseId,
                        row.product,
                        row.product, row.batch,
                        row.qty, row.free, row.ptr, row.ptr, row.mrp, row.disc1, row.gst, row.amount
                    ]
                });
            }
            const res = await window.pharmaAPI.db.transaction(operations);
            if (!res.success) {
                throw new Error(res.error || 'Transaction failed');
            }
            setSuccessMsg(`Purchase Invoice ${invoiceNo} saved successfully! Entry No: ${entryNo}`);
            // Reset form
            setSupplierId('');
            setInvoiceNo('');
            setPaymentMode('Credit');
            setRows([{ id: Date.now(), product: '', batch: '', expiry: '', qty: 0, free: 0, ptr: 0, mrp: 0, disc1: 0, disc2: 0, gst: 12, amount: 0 }]);
        }
        catch (err) {
            console.error("Purchase save error:", err);
            setErrorMsg("Failed to save purchase: " + err.message);
        }
        finally {
            setIsSaving(false);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "page-header", style: { marginBottom: 0 }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "page-title", children: "Purchase Entry (Inward)" }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", children: "Record supplier invoices and update warehouse stock" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", onClick: () => navigate('/transactions/purchases'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeft, { size: 16 }), " Back"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-primary", onClick: handleSave, disabled: isSaving, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Save, { size: 16 }), " ", isSaving ? 'Saving...' : 'Save Purchase Bill'] })] })] }), errorMsg && ((0, jsx_runtime_1.jsxs)("div", { style: { background: '#fee2e2', border: '1px solid #f87171', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { size: 18 }), " ", (0, jsx_runtime_1.jsx)("strong", { children: "Error:" }), " ", errorMsg] })), successMsg && ((0, jsx_runtime_1.jsxs)("div", { style: { background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '0.75rem 1rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)("strong", { children: "Success:" }), " ", successMsg] })), (0, jsx_runtime_1.jsx)("div", { className: "card", children: (0, jsx_runtime_1.jsx)("div", { className: "card-body", children: (0, jsx_runtime_1.jsxs)("div", { className: "form-row-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Supplier / Distributor ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: supplierId, onChange: e => setSupplierId(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select Supplier..." }), suppliersList.map(s => (0, jsx_runtime_1.jsxs)("option", { value: s.id, children: [s.name, " (", s.city, ")"] }, s.id))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Supplier Invoice No ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", placeholder: "e.g. INV-12345", value: invoiceNo, onChange: e => setInvoiceNo(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Invoice Date ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { type: "date", className: "form-input", value: invoiceDate, onChange: e => setInvoiceDate(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Payment Mode" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: paymentMode, onChange: e => setPaymentMode(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "Credit", children: "Credit" }), (0, jsx_runtime_1.jsx)("option", { value: "Cash", children: "Cash" }), (0, jsx_runtime_1.jsx)("option", { value: "Bank / UPI", children: "Bank / UPI" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "GST Type" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: gstType, onChange: e => setGstType(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { children: "Local (CGST + SGST) - Exclusive" }), (0, jsx_runtime_1.jsx)("option", { children: "Interstate (IGST) - Exclusive" }), (0, jsx_runtime_1.jsx)("option", { children: "Local (Inclusive of GST)" })] })] })] }) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [(0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", style: { minWidth: '1200px' }, children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsxs)("th", { style: { width: '200px' }, children: ["Product ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsxs)("th", { style: { width: '100px' }, children: ["Batch ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("th", { style: { width: '80px' }, children: "Expiry" }), (0, jsx_runtime_1.jsxs)("th", { style: { width: '70px' }, children: ["Qty ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("th", { style: { width: '70px' }, children: "Free" }), (0, jsx_runtime_1.jsxs)("th", { style: { width: '90px' }, children: ["PTR (\u20B9) ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsxs)("th", { style: { width: '90px' }, children: ["MRP (\u20B9) ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("th", { style: { width: '70px' }, children: "D1%" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '70px' }, children: "D2%" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '80px' }, children: "GST%" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '100px', textAlign: 'right' }, children: "Net (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '40px' } })] }) }), (0, jsx_runtime_1.jsxs)("tbody", { children: [rows.map((r) => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("select", { className: "form-select form-input-sm", value: r.product, onChange: e => updateRow(r.id, 'product', e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Search Product..." }), productsList.map(p => (0, jsx_runtime_1.jsx)("option", { value: p.id, children: p.name }, p.id))] }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input form-input-sm", placeholder: "Batch No", value: r.batch, onChange: e => updateRow(r.id, 'batch', e.target.value.toUpperCase()) }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input form-input-sm", placeholder: "MM/YY", value: r.expiry, onChange: e => updateRow(r.id, 'expiry', e.target.value) }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", min: "0", value: r.qty === 0 ? '' : r.qty, onChange: e => updateRow(r.id, 'qty', e.target.value) }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", min: "0", value: r.free === 0 ? '' : r.free, onChange: e => updateRow(r.id, 'free', e.target.value) }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", min: "0", step: "0.01", value: r.ptr === 0 ? '' : r.ptr, onChange: e => updateRow(r.id, 'ptr', e.target.value) }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", min: "0", step: "0.01", value: r.mrp === 0 ? '' : r.mrp, onChange: e => updateRow(r.id, 'mrp', e.target.value) }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", min: "0", step: "0.01", value: r.disc1 === 0 ? '' : r.disc1, onChange: e => updateRow(r.id, 'disc1', e.target.value) }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", min: "0", step: "0.01", value: r.disc2 === 0 ? '' : r.disc2, onChange: e => updateRow(r.id, 'disc2', e.target.value) }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("select", { className: "form-select form-input-sm", value: r.gst, onChange: e => updateRow(r.id, 'gst', e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "12", children: "12%" }), (0, jsx_runtime_1.jsx)("option", { value: "5", children: "5%" }), (0, jsx_runtime_1.jsx)("option", { value: "18", children: "18%" }), (0, jsx_runtime_1.jsx)("option", { value: "0", children: "0%" }), (0, jsx_runtime_1.jsx)("option", { value: "28", children: "28%" })] }) }), (0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 600, textAlign: 'right' }, children: r.amount.toFixed(2) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost btn-sm", onClick: () => removeRow(r.id), style: { color: 'var(--danger)', padding: '0.25rem' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { size: 16 }) }) })] }, r.id))), (0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: "12", children: (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-ghost btn-sm", onClick: addRow, style: { color: 'var(--primary)' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { size: 16 }), " Add Product Row"] }) }) })] })] }) }), (0, jsx_runtime_1.jsx)("div", { style: { padding: '1rem', borderTop: '1px solid var(--border)', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end' }, children: (0, jsx_runtime_1.jsxs)("div", { style: { width: '300px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Gross Total:" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["\u20B9 ", totals.sub.toFixed(2)] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Total Discount:" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["- \u20B9 ", totals.disc.toFixed(2)] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Total Tax (GST):" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["+ \u20B9 ", totals.gst.toFixed(2)] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Net Payable:" }), " ", (0, jsx_runtime_1.jsxs)("span", { style: { color: 'var(--primary)' }, children: ["\u20B9 ", totals.net.toFixed(2)] })] })] }) })] })] }));
}
