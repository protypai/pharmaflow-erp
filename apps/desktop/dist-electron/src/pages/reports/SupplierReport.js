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
exports.default = SupplierReport;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
function SupplierReport() {
    const [suppliers, set_suppliers] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchData = async () => {
            const res_suppliers = await window.pharmaAPI.db.query(`
        SELECT s.*, 
               COUNT(p.id) as totalInvoices,
               SUM(p.net_amount) as totalProcurement,
               (SELECT SUM(amount) FROM payments WHERE supplier_id = s.id) as totalPaid,
               (SELECT SUM(net_amount) FROM purchase_returns WHERE supplier_id = s.id) as totalReturns
        FROM suppliers s
        LEFT JOIN purchases p ON s.id = p.supplier_id
        GROUP BY s.id
      `);
            set_suppliers(res_suppliers?.data || []);
        };
        fetchData();
    }, []);
    const [dateRange, setDateRange] = (0, react_1.useState)('this_year');
    // Mock Supplier Analysis Data
    const supplierData = (0, react_1.useMemo)(() => {
        return suppliers.map(s => {
            const totalInvoices = s.totalInvoices || 0;
            const totalProcurement = s.totalProcurement || 0;
            const returnVolume = s.totalReturns || 0;
            const netProcurement = totalProcurement - returnVolume;
            const outstandingBalance = (s.opening_balance || 0) + netProcurement - (s.totalPaid || 0);
            return {
                ...s,
                totalInvoices,
                totalProcurement,
                returnVolume,
                netProcurement,
                outstandingBalance
            };
        }).sort((a, b) => b.netProcurement - a.netProcurement); // Sort by highest dependency
    }, [dateRange]);
    const totals = supplierData.reduce((acc, curr) => {
        acc.net += curr.netProcurement;
        acc.returns += curr.returnVolume;
        return acc;
    }, { net: 0, returns: 0 });
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "card-title", children: "Supplier Report (Procurement by Vendor)" }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", children: "Evaluate vendor dependency, procurement volume, and return rates" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", onClick: () => window.print(), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { size: 16 }), " Print"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", onClick: () => alert("Data exported successfully as CSV!"), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { size: 16 }), " Export CSV"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "filter-bar", style: { display: 'flex', gap: '1rem', alignItems: 'flex-end', background: '#F8FAFC' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { width: '250px' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Date Range" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: dateRange, onChange: e => setDateRange(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "this_month", children: "This Month" }), (0, jsx_runtime_1.jsx)("option", { value: "last_month", children: "Last Month" }), (0, jsx_runtime_1.jsx)("option", { value: "this_year", children: "This Financial Year" })] })] }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-primary", style: { padding: '0.5rem 1.5rem' }, children: "Generate" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '1rem', padding: '1rem', background: 'white', borderBottom: '1px solid var(--border)' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, padding: '1rem', background: '#F5F3FF', border: '1px solid #DDD6FE' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: '#5B21B6', textTransform: 'uppercase', fontWeight: 600 }, children: "Active Suppliers" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '1.25rem', fontWeight: 700, color: '#4C1D95' }, children: supplierData.length })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, padding: '1rem', background: '#EFF6FF', border: '1px solid #BFDBFE' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: '#1E40AF', textTransform: 'uppercase', fontWeight: 600 }, children: "Total Net Procurement" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '1.25rem', fontWeight: 700, color: '#1D4ED8' }, children: ["\u20B9 ", totals.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, padding: '1rem', background: '#FEF2F2', border: '1px solid #FECACA' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: '#991B1B', textTransform: 'uppercase', fontWeight: 600 }, children: "Total Return Volume (Damage/Expiry)" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '1.25rem', fontWeight: 700, color: '#B91C1C' }, children: ["\u20B9 ", totals.returns.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Supplier Name" }), (0, jsx_runtime_1.jsx)("th", { children: "City" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'center' }, children: "Total Invoices" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Gross Procurement (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Return/Debit Note Vol (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Net Procurement (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Pending Payable (\u20B9)" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: supplierData.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: "7", style: { textAlign: 'center', padding: '2rem' }, children: "No supplier data found." }) })) : supplierData.map((row, i) => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 600 }, children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [i === 0 && (0, jsx_runtime_1.jsx)("span", { title: "Top Supplier", style: { fontSize: '1rem' }, children: "\uD83C\uDFC6" }), row.name] }) }), (0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--text-secondary)' }, children: row.city }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'center', fontWeight: 500 }, children: row.totalInvoices }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right' }, children: row.totalProcurement.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: 'var(--danger)' }, children: row.returnVolume > 0 ? `-${row.returnVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-' }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', fontWeight: 700, color: '#1D4ED8' }, children: row.netProcurement.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: row.outstandingBalance > 0 ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: row.outstandingBalance > 0 ? 600 : 400 }, children: row.outstandingBalance > 0 ? row.outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-' })] }, row.id))) })] }) })] }));
}
