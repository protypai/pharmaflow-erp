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
exports.default = SupplierLedger;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const mockData_1 = require("../../data/mockData");
function SupplierLedger() {
    const [supplierId, setSupplierId] = (0, react_1.useState)('');
    // Mock Ledger Entries for a specific supplier
    const ledgerEntries = (0, react_1.useMemo)(() => {
        if (!supplierId)
            return [];
        // Simulate some mock data for Payables
        const entries = [
            { id: 1, date: '2025-07-01', vchType: 'Opening Balance', vchNo: '-', particulars: 'By Opening Balance', debit: 0, credit: 50000 },
            { id: 2, date: '2025-07-05', vchType: 'Purchase', vchNo: 'PUR-101', particulars: 'By Purchase A/c', debit: 0, credit: 25000 },
            { id: 3, date: '2025-07-10', vchType: 'Payment', vchNo: 'PAY-055', particulars: 'To Bank A/c (Cheque #4455)', debit: 30000, credit: 0 },
            { id: 4, date: '2025-07-12', vchType: 'Purchase Return', vchNo: 'PR-020', particulars: 'To Purchase Return A/c', debit: 2000, credit: 0 }
        ];
        let currentBalance = 0;
        return entries.map(entry => {
            // For suppliers (Creditors), Credit increases balance, Debit decreases
            currentBalance += entry.credit - entry.debit;
            return { ...entry, balance: Math.abs(currentBalance), balType: currentBalance >= 0 ? 'Cr' : 'Dr' };
        });
    }, [supplierId]);
    const totals = ledgerEntries.reduce((acc, curr) => {
        acc.debit += curr.debit;
        acc.credit += curr.credit;
        return acc;
    }, { debit: 0, credit: 0 });
    const closingBalance = totals.credit - totals.debit;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "card-title", children: "Supplier Ledger (Statement of Account)" }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", children: "Track running balances, purchases, and payments for vendors" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { size: 16 }), " Print Ledger"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { size: 16 }), " Export PDF"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "filter-bar", style: { display: 'flex', gap: '1rem', alignItems: 'flex-end', background: '#F8FAFC' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { flex: 1, maxWidth: '400px' }, children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Select Supplier ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: supplierId, onChange: e => setSupplierId(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Search Supplier..." }), mockData_1.suppliers.map(s => (0, jsx_runtime_1.jsxs)("option", { value: s.id, children: [s.name, " (", s.city, ")"] }, s.id))] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { width: '150px' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "From Date" }), (0, jsx_runtime_1.jsx)("input", { type: "date", className: "form-input", defaultValue: "2025-04-01" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { width: '150px' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "To Date" }), (0, jsx_runtime_1.jsx)("input", { type: "date", className: "form-input", defaultValue: new Date().toISOString().split('T')[0] })] }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-primary", style: { padding: '0.5rem 1.5rem' }, children: "Go" })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto', background: !supplierId ? '#F8FAFC' : 'white' }, children: !supplierId ? ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.BookOpen, { size: 48, style: { opacity: 0.2, marginBottom: '1rem' } }), (0, jsx_runtime_1.jsx)("p", { children: "Please select a supplier to view their ledger statement." })] })) : ((0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { style: { width: '100px' }, children: "Date" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '120px' }, children: "Vch Type" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '120px' }, children: "Vch No" }), (0, jsx_runtime_1.jsx)("th", { children: "Particulars" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '120px', textAlign: 'right' }, children: "Debit (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '120px', textAlign: 'right' }, children: "Credit (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '150px', textAlign: 'right' }, children: "Balance (\u20B9)" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: ledgerEntries.map((row, i) => ((0, jsx_runtime_1.jsxs)("tr", { style: { background: row.vchType === 'Opening Balance' ? '#F8FAFC' : 'transparent' }, children: [(0, jsx_runtime_1.jsx)("td", { children: row.date }), (0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--text-secondary)' }, children: row.vchType }), (0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--primary)', fontWeight: 500, cursor: 'pointer' }, children: row.vchNo }), (0, jsx_runtime_1.jsx)("td", { children: row.particulars }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: row.debit > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }, children: row.debit > 0 ? row.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-' }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: row.credit > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }, children: row.credit > 0 ? row.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-' }), (0, jsx_runtime_1.jsxs)("td", { style: { textAlign: 'right', fontWeight: 600 }, children: [row.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }), " ", (0, jsx_runtime_1.jsx)("span", { style: { color: 'var(--text-secondary)', fontSize: '0.8rem' }, children: row.balType })] })] }, row.id))) }), (0, jsx_runtime_1.jsx)("tfoot", { style: { position: 'sticky', bottom: 0, background: '#F1F5F9', fontWeight: 700 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { colSpan: "4", style: { textAlign: 'right' }, children: "Total:" }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: 'var(--text-primary)' }, children: totals.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: 'var(--text-primary)' }, children: totals.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsxs)("td", { style: { textAlign: 'right', color: closingBalance >= 0 ? 'var(--danger)' : 'var(--success)' }, children: [Math.abs(closingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 }), " ", closingBalance >= 0 ? 'Cr' : 'Dr'] })] }) })] })) })] }));
}
