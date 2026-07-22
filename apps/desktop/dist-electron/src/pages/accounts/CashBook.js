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
exports.default = CashBook;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
function CashBook() {
    // Mock Cash Book Entries for today
    const cashEntries = (0, react_1.useMemo)(() => {
        const entries = [
            { id: 1, date: '2025-07-21', particulars: 'By Opening Cash Balance', receipt: 12500, payment: 0 },
            { id: 2, date: '2025-07-21', particulars: 'To Sales A/c (Cash Counter)', receipt: 4500, payment: 0 },
            { id: 3, date: '2025-07-21', particulars: 'By Tea & Snacks Exp', receipt: 0, payment: 150 },
            { id: 4, date: '2025-07-21', particulars: 'By Courier Charges', receipt: 0, payment: 80 },
            { id: 5, date: '2025-07-21', particulars: 'To Receipt A/c (Sharma Clinic - Advance)', receipt: 2000, payment: 0 },
            { id: 6, date: '2025-07-21', particulars: 'By Supplier Payment (Local Vendor)', receipt: 0, payment: 3000 }
        ];
        let currentBalance = 0;
        return entries.map(entry => {
            currentBalance += entry.receipt - entry.payment;
            return { ...entry, balance: currentBalance };
        });
    }, []);
    const totals = cashEntries.reduce((acc, curr) => {
        acc.receipt += curr.receipt;
        acc.payment += curr.payment;
        return acc;
    }, { receipt: 0, payment: 0 });
    const openingBalance = cashEntries.length > 0 ? cashEntries[0].receipt : 0;
    const closingBalance = totals.receipt - totals.payment;
    // Actually received today (excluding opening balance)
    const receivedToday = totals.receipt - openingBalance;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "card-title", children: "Cash Book (Day Book)" }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", children: "Track daily physical cash flow and expenses" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { size: 16 }), " Print Cash Book"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { size: 16 }), " Export PDF"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "filter-bar", style: { display: 'flex', gap: '1rem', alignItems: 'flex-end', background: '#F8FAFC' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { width: '150px' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "From Date" }), (0, jsx_runtime_1.jsx)("input", { type: "date", className: "form-input", defaultValue: new Date().toISOString().split('T')[0] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { width: '150px' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "To Date" }), (0, jsx_runtime_1.jsx)("input", { type: "date", className: "form-input", defaultValue: new Date().toISOString().split('T')[0] })] }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-primary", style: { padding: '0.5rem 1.5rem' }, children: "View" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '1rem', padding: '1rem', background: 'white', borderBottom: '1px solid var(--border)' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, padding: '1rem', background: '#F8FAFC', border: '1px solid #E2E8F0' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }, children: "Opening Balance" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '1.25rem', fontWeight: 700 }, children: ["\u20B9 ", openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, padding: '1rem', background: '#F0FDF4', border: '1px solid #BBF7D0' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }, children: "Cash In (Today)" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '1.25rem', fontWeight: 700, color: '#15803D' }, children: ["+ \u20B9 ", receivedToday.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, padding: '1rem', background: '#FEF2F2', border: '1px solid #FECACA' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: '#991B1B', textTransform: 'uppercase', fontWeight: 600 }, children: "Cash Out (Today)" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '1.25rem', fontWeight: 700, color: '#B91C1C' }, children: ["- \u20B9 ", totals.payment.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, padding: '1rem', background: '#EFF6FF', border: '1px solid #BFDBFE' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: '#1E40AF', textTransform: 'uppercase', fontWeight: 600 }, children: "Closing Cash In Hand" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '1.25rem', fontWeight: 700, color: '#1D4ED8' }, children: ["\u20B9 ", closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { style: { width: '120px' }, children: "Date" }), (0, jsx_runtime_1.jsx)("th", { children: "Particulars" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '150px', textAlign: 'right' }, children: "Receipt (Cash In)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '150px', textAlign: 'right' }, children: "Payment (Cash Out)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '150px', textAlign: 'right' }, children: "Running Balance" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: cashEntries.map((row) => ((0, jsx_runtime_1.jsxs)("tr", { style: { background: row.particulars.includes('Opening') ? '#F8FAFC' : 'transparent' }, children: [(0, jsx_runtime_1.jsx)("td", { children: row.date }), (0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 500 }, children: row.particulars }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: row.receipt > 0 ? 'var(--success)' : 'var(--text-secondary)', fontWeight: row.receipt > 0 ? 600 : 400 }, children: row.receipt > 0 ? row.receipt.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-' }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: row.payment > 0 ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: row.payment > 0 ? 600 : 400 }, children: row.payment > 0 ? row.payment.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-' }), (0, jsx_runtime_1.jsxs)("td", { style: { textAlign: 'right', fontWeight: 600 }, children: ["\u20B9 ", row.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }, row.id))) }), (0, jsx_runtime_1.jsx)("tfoot", { style: { position: 'sticky', bottom: 0, background: '#F1F5F9', fontWeight: 700 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { colSpan: "2", style: { textAlign: 'right' }, children: "Totals:" }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: 'var(--success)' }, children: totals.receipt.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: 'var(--danger)' }, children: totals.payment.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsxs)("td", { style: { textAlign: 'right', color: 'var(--primary)' }, children: ["\u20B9 ", closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }) })] }) })] }));
}
