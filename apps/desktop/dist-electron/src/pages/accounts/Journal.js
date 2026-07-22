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
exports.default = Journal;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
function Journal() {
    const [rows, setRows] = (0, react_1.useState)([
        { id: 1, account: '', type: 'Dr', amount: 0 },
        { id: 2, account: '', type: 'Cr', amount: 0 }
    ]);
    const [narration, setNarration] = (0, react_1.useState)('');
    const totals = rows.reduce((acc, row) => {
        if (row.type === 'Dr')
            acc.dr += Number(row.amount) || 0;
        if (row.type === 'Cr')
            acc.cr += Number(row.amount) || 0;
        return acc;
    }, { dr: 0, cr: 0 });
    const isBalanced = totals.dr === totals.cr && totals.dr > 0;
    const addRow = () => {
        setRows([...rows, { id: Date.now(), account: '', type: 'Dr', amount: 0 }]);
    };
    const updateRow = (id, field, value) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };
    const removeRow = (id) => {
        if (rows.length > 2) {
            setRows(rows.filter(r => r.id !== id));
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "page-header", style: { marginBottom: 0 }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "page-title", children: "Journal Voucher (JV)" }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", children: "Post manual double-entry accounting adjustments" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { size: 16 }), " Print JV"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-primary", disabled: !isBalanced, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Save, { size: 16 }), " Post Entry"] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card", children: (0, jsx_runtime_1.jsx)("div", { className: "card-body", children: (0, jsx_runtime_1.jsxs)("div", { className: "form-row-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Voucher Date ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { type: "date", className: "form-input", defaultValue: new Date().toISOString().split('T')[0] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Voucher No" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", defaultValue: "JV-1004", disabled: true })] })] }) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: [(0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { style: { width: '80px' }, children: "Dr / Cr" }), (0, jsx_runtime_1.jsx)("th", { children: "Account Ledger" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '200px', textAlign: 'right' }, children: "Debit (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '200px', textAlign: 'right' }, children: "Credit (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '40px' } })] }) }), (0, jsx_runtime_1.jsxs)("tbody", { children: [rows.map((r) => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("select", { className: "form-select form-input-sm", value: r.type, onChange: e => updateRow(r.id, 'type', e.target.value), style: { fontWeight: 600 }, children: [(0, jsx_runtime_1.jsx)("option", { value: "Dr", children: "Dr" }), (0, jsx_runtime_1.jsx)("option", { value: "Cr", children: "Cr" })] }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("select", { className: "form-select form-input-sm", value: r.account, onChange: e => updateRow(r.id, 'account', e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select Ledger Account..." }), (0, jsx_runtime_1.jsx)("option", { value: "salary", children: "Salary Expense A/c" }), (0, jsx_runtime_1.jsx)("option", { value: "rent", children: "Rent Expense A/c" }), (0, jsx_runtime_1.jsx)("option", { value: "dep", children: "Depreciation A/c" }), (0, jsx_runtime_1.jsx)("option", { value: "bank_charges", children: "Bank Charges A/c" }), (0, jsx_runtime_1.jsx)("option", { value: "cash", children: "Cash A/c" }), (0, jsx_runtime_1.jsx)("option", { value: "hdfc", children: "HDFC Bank A/c" })] }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", style: { textAlign: 'right' }, value: r.type === 'Dr' ? r.amount || '' : '', onChange: e => updateRow(r.id, 'amount', e.target.value), disabled: r.type !== 'Dr' }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", style: { textAlign: 'right' }, value: r.type === 'Cr' ? r.amount || '' : '', onChange: e => updateRow(r.id, 'amount', e.target.value), disabled: r.type !== 'Cr' }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost btn-sm", onClick: () => removeRow(r.id), style: { color: 'var(--danger)', padding: '0.25rem' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { size: 16 }) }) })] }, r.id))), (0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: "5", children: (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-ghost btn-sm", onClick: addRow, style: { color: 'var(--primary)' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { size: 16 }), " Add Row"] }) }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { padding: '1.5rem', borderTop: '1px solid var(--border)' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Narration (Remarks)" }), (0, jsx_runtime_1.jsx)("textarea", { className: "form-input", rows: "3", placeholder: "e.g., Being salary paid for the month of July 2025...", value: narration, onChange: e => setNarration(e.target.value) })] })] }), (0, jsx_runtime_1.jsx)("div", { style: { padding: '1rem', borderTop: '1px solid var(--border)', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end' }, children: (0, jsx_runtime_1.jsxs)("div", { style: { width: '450px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 600 }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Total Debit:" }), (0, jsx_runtime_1.jsxs)("span", { children: ["\u20B9 ", totals.dr.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 600 }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Total Credit:" }), (0, jsx_runtime_1.jsxs)("span", { children: ["\u20B9 ", totals.cr.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }), (0, jsx_runtime_1.jsx)("div", { style: {
                                        marginTop: '0.5rem',
                                        paddingTop: '0.5rem',
                                        borderTop: '1px solid var(--border)',
                                        display: 'flex',
                                        justifyContent: 'center'
                                    }, children: isBalanced ? ((0, jsx_runtime_1.jsxs)("div", { style: { color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)("span", { style: { display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' } }), "Voucher is Balanced"] })) : ((0, jsx_runtime_1.jsxs)("div", { style: { color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)("span", { style: { display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' } }), "Difference: \u20B9 ", Math.abs(totals.dr - totals.cr).toLocaleString('en-IN', { minimumFractionDigits: 2 })] })) })] }) })] })] }));
}
