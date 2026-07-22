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
exports.default = PurchaseReport;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const mockData_1 = require("../../data/mockData");
function PurchaseReport() {
    const [dateRange, setDateRange] = (0, react_1.useState)('this_month');
    const [supplierId, setSupplierId] = (0, react_1.useState)('');
    // Mock Purchase Data
    const purchaseData = (0, react_1.useMemo)(() => {
        const data = [
            { id: 'PO-2001', date: '2025-07-02', supplierId: 1, gross: 45000, discount: 2000, gst: 5160, net: 48160, items: 45 },
            { id: 'PO-2002', date: '2025-07-08', supplierId: 2, gross: 120000, discount: 5000, gst: 13800, net: 128800, items: 120 },
            { id: 'PO-2003', date: '2025-07-15', supplierId: 1, gross: 25000, discount: 1000, gst: 2880, net: 26880, items: 30 },
            { id: 'PO-2004', date: '2025-07-19', supplierId: 3, gross: 8000, discount: 0, gst: 960, net: 8960, items: 10 }
        ];
        let filtered = data;
        if (supplierId) {
            filtered = data.filter(d => d.supplierId === parseInt(supplierId));
        }
        return filtered.map(d => ({
            ...d,
            supplierName: mockData_1.suppliers.find(s => s.id === d.supplierId)?.name || 'Unknown Supplier'
        }));
    }, [supplierId, dateRange]);
    const totals = purchaseData.reduce((acc, curr) => {
        acc.gross += curr.gross;
        acc.discount += curr.discount;
        acc.gst += curr.gst;
        acc.net += curr.net;
        return acc;
    }, { gross: 0, discount: 0, gst: 0, net: 0 });
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "card-title", children: "Purchase Report (Procurement Analysis)" }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", children: "Audit procurement costs, supplier invoices, and input tax" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", onClick: () => window.print(), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { size: 16 }), " Print"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", onClick: () => alert("Data exported successfully as CSV!"), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { size: 16 }), " Export CSV"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "filter-bar", style: { display: 'flex', gap: '1rem', alignItems: 'flex-end', background: '#F8FAFC' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { width: '200px' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Date Range" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: dateRange, onChange: e => setDateRange(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "today", children: "Today" }), (0, jsx_runtime_1.jsx)("option", { value: "this_week", children: "This Week" }), (0, jsx_runtime_1.jsx)("option", { value: "this_month", children: "This Month" }), (0, jsx_runtime_1.jsx)("option", { value: "last_month", children: "Last Month" })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { flex: 1, maxWidth: '300px' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Filter by Supplier" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: supplierId, onChange: e => setSupplierId(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "All Suppliers" }), mockData_1.suppliers.map(s => (0, jsx_runtime_1.jsx)("option", { value: s.id, children: s.name }, s.id))] })] }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-primary", style: { padding: '0.5rem 1.5rem' }, children: "Generate" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '1rem', padding: '1rem', background: 'white', borderBottom: '1px solid var(--border)' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, padding: '1rem', background: '#F5F3FF', border: '1px solid #DDD6FE' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: '#5B21B6', textTransform: 'uppercase', fontWeight: 600 }, children: "Total Purchase Bills" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '1.25rem', fontWeight: 700, color: '#4C1D95' }, children: purchaseData.length })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, padding: '1rem', background: '#FEF2F2', border: '1px solid #FECACA' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: '#991B1B', textTransform: 'uppercase', fontWeight: 600 }, children: "Total Procurement Cost" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '1.25rem', fontWeight: 700, color: '#B91C1C' }, children: ["\u20B9 ", totals.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, padding: '1rem', background: '#ECFDF5', border: '1px solid #A7F3D0' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: '#065F46', textTransform: 'uppercase', fontWeight: 600 }, children: "Total Input GST (Credit)" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '1.25rem', fontWeight: 700, color: '#047857' }, children: ["\u20B9 ", totals.gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { style: { width: '120px' }, children: "Date" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '150px' }, children: "Purchase Bill No" }), (0, jsx_runtime_1.jsx)("th", { children: "Supplier Name" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '80px', textAlign: 'center' }, children: "Items" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '120px', textAlign: 'right' }, children: "Gross (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '120px', textAlign: 'right' }, children: "CD/Sch (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '120px', textAlign: 'right' }, children: "GST (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '150px', textAlign: 'right' }, children: "Net Amount (\u20B9)" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: purchaseData.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: "8", style: { textAlign: 'center', padding: '2rem' }, children: "No purchases found for this period." }) })) : purchaseData.map((row) => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { children: row.date }), (0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }, children: row.id }), (0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 500 }, children: row.supplierName }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'center', color: 'var(--text-secondary)' }, children: row.items }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right' }, children: row.gross.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: 'var(--success)' }, children: row.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right' }, children: row.gst.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', fontWeight: 700, color: '#B91C1C' }, children: row.net.toLocaleString('en-IN', { minimumFractionDigits: 2 }) })] }, row.id))) }), (0, jsx_runtime_1.jsx)("tfoot", { style: { position: 'sticky', bottom: 0, background: '#F1F5F9', fontWeight: 700 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { colSpan: "4", style: { textAlign: 'right' }, children: "Grand Total:" }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right' }, children: totals.gross.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: 'var(--success)' }, children: totals.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right' }, children: totals.gst.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsxs)("td", { style: { textAlign: 'right', color: '#B91C1C', fontSize: '1.1rem' }, children: ["\u20B9 ", totals.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }) })] }) })] }));
}
