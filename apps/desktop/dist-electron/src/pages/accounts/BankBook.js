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
exports.default = BankBook;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
function BankBook() {
    const [bankId, setBankId] = (0, react_1.useState)('hdfc');
    const [bankEntries, setBankEntries] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchBankBook = async () => {
            try {
                const query = `
          SELECT * FROM (
            SELECT id, date, 'By Receipt: ' || IFNULL(notes, 'Bank') as particulars, IFNULL(cheque_no, payment_mode) as instrument, amount as deposit, 0 as withdrawal 
            FROM receipts WHERE payment_mode != 'cash'
            UNION ALL
            SELECT id, date, 'To Payment: ' || IFNULL(notes, 'Bank') as particulars, IFNULL(cheque_no, payment_mode) as instrument, 0 as deposit, amount as withdrawal 
            FROM payments WHERE payment_mode != 'cash'
          ) ORDER BY date ASC
        `;
                const res = await window.pharmaAPI.db.query(query);
                const entries = res?.data || [];
                let currentBalance = 0;
                const processed = entries.map(entry => {
                    currentBalance += (entry.deposit || 0) - (entry.withdrawal || 0);
                    return { ...entry, balance: currentBalance };
                });
                setBankEntries(processed);
            }
            catch (err) {
                console.error("Failed to fetch bank book:", err);
            }
        };
        fetchBankBook();
    }, [bankId]);
    const totals = bankEntries.reduce((acc, curr) => {
        acc.withdrawal += curr.withdrawal;
        acc.deposit += curr.deposit;
        return acc;
    }, { withdrawal: 0, deposit: 0 });
    const openingBalance = bankEntries.length > 0 ? bankEntries[0].deposit : 0;
    const closingBalance = totals.deposit - totals.withdrawal;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "card-title", children: "Bank Book (Bank Reconciliation)" }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", children: "Track digital transactions and reconcile with bank statements" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { size: 16 }), " Print Bank Book"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { size: 16 }), " Export PDF"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "filter-bar", style: { display: 'flex', gap: '1rem', alignItems: 'flex-end', background: '#F8FAFC' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { flex: 1, maxWidth: '300px' }, children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Select Bank Account ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: bankId, onChange: e => setBankId(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "hdfc", children: "HDFC Current A/c - 502000123" }), (0, jsx_runtime_1.jsx)("option", { value: "sbi", children: "SBI Current A/c - 301000987" })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { width: '150px' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "From Date" }), (0, jsx_runtime_1.jsx)("input", { type: "date", className: "form-input", defaultValue: "2025-07-01" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { width: '150px' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "To Date" }), (0, jsx_runtime_1.jsx)("input", { type: "date", className: "form-input", defaultValue: new Date().toISOString().split('T')[0] })] }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-primary", style: { padding: '0.5rem 1.5rem' }, children: "View" })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { style: { width: '100px' }, children: "Date" }), (0, jsx_runtime_1.jsx)("th", { children: "Particulars" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '150px' }, children: "Inst / Chq No" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '150px', textAlign: 'right' }, children: "Withdrawal (Dr)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '150px', textAlign: 'right' }, children: "Deposit (Cr)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '150px', textAlign: 'right' }, children: "Running Balance" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: bankEntries.map((row) => ((0, jsx_runtime_1.jsxs)("tr", { style: { background: row.particulars.includes('Opening') ? '#F8FAFC' : 'transparent' }, children: [(0, jsx_runtime_1.jsx)("td", { children: row.date }), (0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 500 }, children: row.particulars }), (0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--text-secondary)' }, children: row.instrument }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: row.withdrawal > 0 ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: row.withdrawal > 0 ? 600 : 400 }, children: row.withdrawal > 0 ? row.withdrawal.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-' }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: row.deposit > 0 ? 'var(--success)' : 'var(--text-secondary)', fontWeight: row.deposit > 0 ? 600 : 400 }, children: row.deposit > 0 ? row.deposit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-' }), (0, jsx_runtime_1.jsxs)("td", { style: { textAlign: 'right', fontWeight: 600 }, children: ["\u20B9 ", row.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }, row.id))) }), (0, jsx_runtime_1.jsx)("tfoot", { style: { position: 'sticky', bottom: 0, background: '#F1F5F9', fontWeight: 700 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { colSpan: "3", style: { textAlign: 'right' }, children: "Totals:" }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: 'var(--danger)' }, children: totals.withdrawal.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: 'var(--success)' }, children: totals.deposit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsxs)("td", { style: { textAlign: 'right', color: 'var(--primary)' }, children: ["\u20B9 ", closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }) })] }) })] }));
}
