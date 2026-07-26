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
exports.default = SalesReturn;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const dataService_1 = require("../../services/dataService");
function SalesReturn() {
    const [customers, set_customers] = (0, react_1.useState)([]);
    const [products, set_products] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchData = async () => {
            const res_customers = await window.pharmaAPI.db.query("SELECT * FROM customers");
            set_customers(res_customers?.data || []);
            const res_products = await window.pharmaAPI.db.query(`
        SELECT p.*, json_group_array(json_object('id', b.id, 'batch', b.batch_no, 'expiry', b.expiry_date, 'mrp', b.mrp, 'ptr', b.ptr, 'current_qty', b.current_qty)) as batches
        FROM products p
        LEFT JOIN batches b ON p.id = b.product_id
        GROUP BY p.id
      `);
            set_products(res_products?.data?.map(p => ({
                ...p,
                batches: p.batches ? JSON.parse(p.batches).filter(b => b.id) : []
            })) || []);
        };
        fetchData();
    }, []);
    const [lookupInvoiceNo, setLookupInvoiceNo] = (0, react_1.useState)('');
    const [returnDate, setReturnDate] = (0, react_1.useState)(new Date().toISOString().split('T')[0]);
    const [returnReason, setReturnReason] = (0, react_1.useState)('Salable Return (Add back to active stock)');
    const [errorMsg, setErrorMsg] = (0, react_1.useState)('');
    const [successMsg, setSuccessMsg] = (0, react_1.useState)('');
    const [originalSaleId, setOriginalSaleId] = (0, react_1.useState)(null);
    const [customerId, setCustomerId] = (0, react_1.useState)('');
    const [rows, setRows] = (0, react_1.useState)([
        { id: 1, product: '', batch: '', expiry: '', qty: 0, rate: 0, disc: 0, gst: 12, amount: 0 }
    ]);
    const [totals, setTotals] = (0, react_1.useState)({ sub: 0, disc: 0, gst: 0, net: 0 });
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
        const hasChanged = newRows.some((r, i) => r.amount !== rows[i].amount);
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
        setRows([...rows, { id: Date.now(), product: '', batch: '', expiry: '', qty: 0, rate: 0, disc: 0, gst: 12, amount: 0 }]);
    };
    const updateRow = (id, field, value) => {
        setRows(rows.map(r => {
            if (r.id !== id)
                return r;
            let updated = { ...r, [field]: value };
            if (field === 'product') {
                updated.batch = '';
                updated.expiry = '';
                updated.rate = 0;
                const prod = products.find(p => p.id.toString() === value.toString());
                if (prod)
                    updated.gst = prod.gst;
            }
            if (field === 'batch' && r.product) {
                const prod = products.find(p => p.id.toString() === r.product.toString());
                if (prod) {
                    const batchData = prod.batches.find(b => b.batch === value);
                    if (batchData) {
                        updated.expiry = batchData.expiry;
                        updated.rate = batchData.mrp;
                    }
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
    const handleFetchInvoice = async () => {
        setErrorMsg('');
        setSuccessMsg('');
        if (!lookupInvoiceNo)
            return;
        try {
            const saleRes = await window.pharmaAPI.db.query("SELECT * FROM sales WHERE invoice_no = ?", [lookupInvoiceNo]);
            if (!saleRes.success || saleRes.data.length === 0) {
                setErrorMsg("Invoice not found.");
                return;
            }
            const sale = saleRes.data[0];
            setCustomerId(sale.customer_id);
            setOriginalSaleId(sale.id);
            const itemsRes = await window.pharmaAPI.db.query(`
        SELECT si.*, b.batch_no, b.expiry_date, p.gst_rate as prod_gst
        FROM sale_items si
        JOIN batches b ON si.batch_id = b.id
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
      `, [sale.id]);
            if (itemsRes.success && itemsRes.data.length > 0) {
                const newRows = itemsRes.data.map(item => ({
                    id: Date.now() + Math.random(),
                    product: item.product_id.toString(),
                    batch_id: item.batch_id,
                    batch: item.batch_no,
                    expiry: item.expiry_date,
                    qty: item.qty,
                    rate: item.mrp,
                    disc: item.disc_percent || 0,
                    gst: item.gst_rate || item.prod_gst || 12,
                    amount: 0 // Will be calculated by useEffect
                }));
                setRows(newRows);
                setSuccessMsg("Invoice loaded successfully. Adjust quantities to return.");
            }
            else {
                setErrorMsg("No items found for this invoice.");
            }
        }
        catch (err) {
            setErrorMsg("Error fetching invoice: " + err.message);
        }
    };
    const handleSave = async () => {
        setErrorMsg('');
        setSuccessMsg('');
        if (!customerId) {
            setErrorMsg("Please select a customer.");
            return;
        }
        if (rows.length === 0 || !rows[0].product) {
            setErrorMsg("Please add at least one product to return.");
            return;
        }
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userRes = await window.pharmaAPI.db.query("SELECT company_id FROM users WHERE email = ?", [user.email]);
            if (!userRes?.data?.length)
                throw new Error("Admin user not found in local DB");
            const companyId = userRes.data[0].company_id;
            const returnId = 'SR-' + Date.now();
            const entryNo = 'SRET-' + Date.now();
            const res = await window.pharmaAPI.db.run(`
        INSERT INTO sale_returns (id, company_id, entry_no, sale_id, customer_id, return_date, reason, net_amount, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'saved', datetime('now'), datetime('now'))
      `, [returnId, companyId, entryNo, originalSaleId, customerId, returnDate, returnReason, totals.net]);
            if (!res.success)
                throw new Error(res.error);
            await (0, dataService_1.syncEntity)('SaleReturn', 'create', {
                id: returnId,
                companyId,
                entryNo,
                saleId: originalSaleId,
                customerId,
                returnDate: new Date(returnDate).toISOString(),
                reason: returnReason,
                netAmount: totals.net,
                status: 'saved'
            });
            for (const row of rows) {
                if (!row.product || !row.qty)
                    continue;
                const prod = products.find(p => p.id.toString() === row.product.toString());
                const batchData = prod?.batches.find(b => b.batch === row.batch);
                if (!batchData)
                    throw new Error("Batch not found for product.");
                const returnItemId = 'SRI-' + Date.now() + Math.random();
                await window.pharmaAPI.db.run(`
          INSERT INTO sale_return_items (id, return_id, product_id, batch_id, qty, rate, disc_percent, gst_rate, net_amount, reason)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [returnItemId, returnId, row.product, batchData.id, row.qty, row.rate, row.disc, row.gst, row.amount, returnReason]);
                const mapReturnReason = (r) => {
                    if (r.includes('Salable'))
                        return 'excess_supply';
                    if (r.includes('Expired'))
                        return 'expired';
                    if (r.includes('Breakage'))
                        return 'damaged';
                    return 'quality_issue';
                };
                await (0, dataService_1.syncEntity)('SaleReturnItem', 'create', {
                    id: returnItemId,
                    returnId,
                    productId: row.product,
                    batchId: batchData.id,
                    qty: row.qty,
                    mrp: row.rate,
                    salePrice: row.rate,
                    netAmount: row.amount,
                    reason: mapReturnReason(returnReason)
                });
                // Increase stock if salable return
                if (returnReason.includes("Salable")) {
                    await window.pharmaAPI.db.run(`
            UPDATE batches SET current_qty = current_qty + ? WHERE id = ?
          `, [row.qty, batchData.id]);
                    await (0, dataService_1.syncEntity)('Batch', 'update', {
                        id: batchData.id,
                        currentQty: batchData.current_qty + Number(row.qty)
                    });
                }
            }
            setSuccessMsg("Sales Return saved successfully!");
            setRows([{ id: 1, product: '', batch: '', expiry: '', qty: 0, rate: 0, disc: 0, gst: 12, amount: 0 }]);
            setLookupInvoiceNo('');
            setOriginalSaleId(null);
        }
        catch (err) {
            setErrorMsg("Failed to save return: " + err.message);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "page-header", style: { marginBottom: 0 }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "page-title", children: "Sales Return (Credit Note)" }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", children: "Receive returns from customer and issue credit note" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { size: 16 }), " Print Credit Note"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-primary", onClick: handleSave, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Save, { size: 16 }), " Save Return"] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card", children: (0, jsx_runtime_1.jsxs)("div", { className: "card-body", children: [errorMsg && ((0, jsx_runtime_1.jsx)("div", { style: { background: '#fee2e2', color: '#dc2626', padding: '0.75rem', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #f87171' }, children: errorMsg })), successMsg && ((0, jsx_runtime_1.jsx)("div", { style: { background: '#dcfce7', color: '#166534', padding: '0.75rem', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #86efac' }, children: successMsg })), (0, jsx_runtime_1.jsxs)("div", { className: "form-row-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Customer ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: customerId, onChange: e => setCustomerId(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select Customer..." }), customers.map(c => (0, jsx_runtime_1.jsx)("option", { value: c.id, children: c.name }, c.id))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Return Date ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { type: "date", className: "form-input", value: returnDate, onChange: e => setReturnDate(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Original Sales Bill No (Lookup)" }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "search-input-wrap", style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 16, className: "search-icon" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", placeholder: "Enter bill to auto-fill...", value: lookupInvoiceNo, onChange: e => setLookupInvoiceNo(e.target.value), onKeyDown: e => e.key === 'Enter' && handleFetchInvoice() })] }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-secondary", onClick: handleFetchInvoice, children: "Fetch" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Stock Status / Reason" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: returnReason, onChange: e => setReturnReason(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "Salable Return (Add back to active stock)", children: "Salable Return (Add back to active stock)" }), (0, jsx_runtime_1.jsx)("option", { value: "Expired Return (Move to damage Godown)", children: "Expired Return (Move to damage Godown)" }), (0, jsx_runtime_1.jsx)("option", { value: "Breakage / Damaged (Write-off)", children: "Breakage / Damaged (Write-off)" })] })] })] })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [(0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", style: { minWidth: '1000px' }, children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { style: { width: '250px' }, children: "Product" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '150px' }, children: "Batch" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '100px' }, children: "Expiry" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '100px' }, children: "Return Qty" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '120px' }, children: "Billed Rate (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '100px' }, children: "Disc %" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '100px' }, children: "GST%" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '150px', textAlign: 'right' }, children: "Amount (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '40px' } })] }) }), (0, jsx_runtime_1.jsxs)("tbody", { children: [rows.map((r) => {
                                            const prod = products.find(p => p.id.toString() === r.product.toString());
                                            return ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("select", { className: "form-select form-input-sm", value: r.product, onChange: e => updateRow(r.id, 'product', e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select Product..." }), products.map(p => (0, jsx_runtime_1.jsx)("option", { value: p.id, children: p.name }, p.id))] }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("select", { className: "form-select form-input-sm", value: r.batch, onChange: e => updateRow(r.id, 'batch', e.target.value), disabled: !r.product, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select Batch" }), prod && prod.batches.map(b => ((0, jsx_runtime_1.jsx)("option", { value: b.batch, children: b.batch }, b.id)))] }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input form-input-sm", value: r.expiry, readOnly: true, style: { background: '#F8FAFC' } }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", min: "1", value: r.qty || '', onChange: e => updateRow(r.id, 'qty', e.target.value) }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", value: r.rate || '', onChange: e => updateRow(r.id, 'rate', e.target.value) }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", value: r.disc || '', onChange: e => updateRow(r.id, 'disc', e.target.value) }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", value: r.gst, readOnly: true, style: { background: '#F8FAFC' } }) }), (0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 600, textAlign: 'right' }, children: r.amount.toFixed(2) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost btn-sm", onClick: () => removeRow(r.id), style: { color: 'var(--danger)', padding: '0.25rem' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { size: 16 }) }) })] }, r.id));
                                        }), (0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: "9", children: (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-ghost btn-sm", onClick: addRow, style: { color: 'var(--primary)' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { size: 16 }), " Add Product Row"] }) }) })] })] }) }), (0, jsx_runtime_1.jsx)("div", { style: { padding: '1rem', borderTop: '1px solid var(--border)', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end' }, children: (0, jsx_runtime_1.jsxs)("div", { style: { width: '300px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Gross Return:" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["\u20B9 ", totals.sub.toFixed(2)] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Discount Reversed:" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["- \u20B9 ", totals.disc.toFixed(2)] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "GST Reversed:" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["+ \u20B9 ", totals.gst.toFixed(2)] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Net Credit Note:" }), " ", (0, jsx_runtime_1.jsxs)("span", { style: { color: 'var(--success)' }, children: ["\u20B9 ", totals.net.toFixed(2)] })] })] }) })] })] }));
}
