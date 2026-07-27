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
exports.default = StockAdjustment;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const dataService_1 = require("../../services/dataService");
function StockAdjustment() {
    const [products, set_products] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchData = async () => {
            const res_products = await window.pharmaAPI.db.query("SELECT * FROM products");
            set_products(res_products?.data || []);
        };
        fetchData();
    }, []);
    const [rows, setRows] = (0, react_1.useState)([
        { id: 1, product: '', batch: '', sysQty: 0, actualQty: '', diff: 0 }
    ]);
    const addRow = () => {
        setRows([...rows, { id: Date.now(), product: '', batch: '', sysQty: 0, actualQty: '', diff: 0 }]);
    };
    const updateRow = (id, field, value) => {
        setRows(rows.map(r => {
            if (r.id !== id)
                return r;
            let updated = { ...r, [field]: value };
            if (field === 'product') {
                updated.batch = '';
                updated.sysQty = 0;
                updated.actualQty = '';
                updated.diff = 0;
            }
            if (field === 'batch' && r.product) {
                const prod = products.find(p => p.id === parseInt(r.product));
                if (prod) {
                    const batchData = prod.batches.find(b => b.batch === value);
                    if (batchData) {
                        updated.sysQty = batchData.qty;
                        if (updated.actualQty !== '') {
                            updated.diff = Number(updated.actualQty) - batchData.qty;
                        }
                    }
                }
            }
            if (field === 'actualQty') {
                if (value === '') {
                    updated.diff = 0;
                }
                else {
                    updated.diff = Number(value) - updated.sysQty;
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
    const [adjDate, setAdjDate] = (0, react_1.useState)(new Date().toISOString().split('T')[0]);
    const [refNo, setRefNo] = (0, react_1.useState)('');
    const [reason, setReason] = (0, react_1.useState)('Physical Count Mismatch');
    const [authBy, setAuthBy] = (0, react_1.useState)('Admin User');
    const handleSave = async () => {
        const validRows = rows.filter(r => r.product && r.batch && r.actualQty !== '');
        if (validRows.length === 0)
            return alert("Add at least one product to adjust.");
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userRes = await window.pharmaAPI.db.query("SELECT company_id FROM users WHERE id = ? OR email = ?", [user.id || '', user.email || '']);
            if (!userRes?.data?.length)
                throw new Error("Admin user not found in local DB");
            const companyId = userRes.data[0].company_id;
            const adjId = 'ADJ-' + Date.now();
            await window.pharmaAPI.db.run(`
        INSERT INTO stock_adjustments (id, company_id, date, reference_no, reason, authorized_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [adjId, companyId, adjDate, refNo, reason, authBy]);
            const mapReason = (r) => {
                if (r.includes('Mismatch'))
                    return 'physical_count';
                if (r.includes('Damage'))
                    return 'damage';
                if (r.includes('Theft'))
                    return 'lost_theft';
                if (r.includes('Expired'))
                    return 'expired_destroyed';
                return 'other';
            };
            await (0, dataService_1.syncEntity)('StockAdjustment', 'create', {
                id: adjId,
                companyId,
                entryNo: refNo || adjId,
                date: new Date(adjDate).toISOString(),
                reason: mapReason(reason),
                notes: "Authorized by: " + authBy
            });
            for (const row of validRows) {
                const prod = products.find(p => p.id === parseInt(row.product));
                const batchData = prod?.batches.find(b => b.batch === row.batch);
                if (batchData) {
                    await window.pharmaAPI.db.run(`
            UPDATE batches SET current_qty = ? WHERE id = ?
          `, [Number(row.actualQty), batchData.id]);
                    await (0, dataService_1.syncEntity)('Batch', 'update', {
                        id: batchData.id,
                        currentQty: Number(row.actualQty)
                    });
                }
            }
            alert("Stock Adjustment saved!");
            setRows([{ id: 1, product: '', batch: '', sysQty: 0, actualQty: '', diff: 0 }]);
            setRefNo('');
        }
        catch (err) {
            alert("Error: " + err.message);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "page-header", style: { marginBottom: 0 }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "page-title", children: "Stock Adjustment" }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", children: "Reconcile physical stock with system stock" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { size: 16 }), " Print Report"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-primary", onClick: handleSave, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Save, { size: 16 }), " Save Adjustment"] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card", children: (0, jsx_runtime_1.jsx)("div", { className: "card-body", children: (0, jsx_runtime_1.jsxs)("div", { className: "form-row-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Adjustment Date ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { type: "date", className: "form-input", value: adjDate, onChange: e => setAdjDate(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Reference No" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", placeholder: "e.g. PHY-CNT-01", value: refNo, onChange: e => setRefNo(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Reason for Adjustment ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: reason, onChange: e => setReason(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "Physical Count Mismatch", children: "Physical Count Mismatch" }), (0, jsx_runtime_1.jsx)("option", { value: "Damage / Breakage in Warehouse", children: "Damage / Breakage in Warehouse" }), (0, jsx_runtime_1.jsx)("option", { value: "Theft / Loss", children: "Theft / Loss" }), (0, jsx_runtime_1.jsx)("option", { value: "Expired & Destroyed", children: "Expired & Destroyed" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Authorized By ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", value: authBy, onChange: e => setAuthBy(e.target.value) })] })] }) }) }), (0, jsx_runtime_1.jsx)("div", { className: "card", style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { style: { width: '300px' }, children: "Product" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '200px' }, children: "Batch" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '150px' }, children: "System Qty" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '150px' }, children: "Actual Qty (Input)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '150px' }, children: "Difference (+/-)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '40px' } })] }) }), (0, jsx_runtime_1.jsxs)("tbody", { children: [rows.map((r) => {
                                        const prod = products.find(p => p.id === parseInt(r.product));
                                        return ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("select", { className: "form-select form-input-sm", value: r.product, onChange: e => updateRow(r.id, 'product', e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select Product..." }), products.map(p => (0, jsx_runtime_1.jsx)("option", { value: p.id, children: p.name }, p.id))] }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("select", { className: "form-select form-input-sm", value: r.batch, onChange: e => updateRow(r.id, 'batch', e.target.value), disabled: !r.product, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select Batch" }), prod && prod.batches.map(b => ((0, jsx_runtime_1.jsxs)("option", { value: b.batch, children: [b.batch, " (", b.qty, " in system)"] }, b.id)))] }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", value: r.sysQty, readOnly: true, style: { background: '#F8FAFC' } }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", value: r.actualQty, onChange: e => updateRow(r.id, 'actualQty', e.target.value), placeholder: "Counted Qty" }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("div", { style: {
                                                            fontWeight: 600,
                                                            color: r.diff > 0 ? 'var(--success)' : r.diff < 0 ? 'var(--danger)' : 'var(--text-primary)',
                                                            padding: '0.25rem 0.5rem'
                                                        }, children: r.diff > 0 ? `+${r.diff}` : r.diff }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost btn-sm", onClick: () => removeRow(r.id), style: { color: 'var(--danger)', padding: '0.25rem' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { size: 16 }) }) })] }, r.id));
                                    }), (0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: "6", children: (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-ghost btn-sm", onClick: addRow, style: { color: 'var(--primary)' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { size: 16 }), " Add Product Row"] }) }) })] })] }) }) })] }));
}
