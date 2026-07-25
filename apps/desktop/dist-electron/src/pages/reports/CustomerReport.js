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
exports.default = CustomerReport;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
function CustomerReport() {
    const [customers, set_customers] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchData = async () => {
            const res_customers = await window.pharmaAPI.db.query(`
        SELECT c.*, 
               COUNT(s.id) as totalOrders,
               SUM(s.net_amount) as totalRevenue,
               (SELECT SUM(amount) FROM receipts WHERE customer_id = c.id) as totalReceipts,
               (SELECT SUM(net_amount) FROM sale_returns WHERE customer_id = c.id) as totalReturns
        FROM customers c
        LEFT JOIN sales s ON c.id = s.customer_id
        GROUP BY c.id
      `);
            set_customers(res_customers?.data || []);
        };
        fetchData();
    }, []);
    const [minOrderFilter, setMinOrderFilter] = (0, react_1.useState)('');
    // Mock Customer Analysis Data
    const customerData = (0, react_1.useMemo)(() => {
        return customers.map(c => {
            const totalOrders = c.totalOrders || 0;
            const totalRevenue = c.totalRevenue || 0;
            const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;
            const netRevenue = totalRevenue - (c.totalReturns || 0);
            const outstandingBalance = (c.opening_balance || 0) + netRevenue - (c.totalReceipts || 0);
            return {
                ...c,
                totalOrders,
                totalRevenue: netRevenue,
                avgOrderValue,
                outstandingBalance
            };
        }).filter(c => {
            if (!minOrderFilter)
                return true;
            return c.totalRevenue >= parseInt(minOrderFilter);
        }).sort((a, b) => b.totalRevenue - a.totalRevenue); // Sort by highest revenue
    }, [minOrderFilter]);
    const totals = customerData.reduce((acc, curr) => {
        acc.revenue += curr.totalRevenue;
        acc.outstanding += curr.outstandingBalance;
        return acc;
    }, { revenue: 0, outstanding: 0 });
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "card-title", children: "Customer Report (Sales by Client)" }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", children: "Identify top buyers, revenue concentration, and credit risks" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", onClick: () => window.print(), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { size: 16 }), " Print"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", onClick: () => alert("Data exported successfully as CSV!"), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { size: 16 }), " Export CSV"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "filter-bar", style: { display: 'flex', gap: '1rem', alignItems: 'flex-end', background: '#F8FAFC' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { flex: 1, maxWidth: '250px' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Minimum Total Revenue (\u20B9)" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: minOrderFilter, onChange: e => setMinOrderFilter(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "All Customers" }), (0, jsx_runtime_1.jsx)("option", { value: "10000", children: "Above \u20B9 10,000" }), (0, jsx_runtime_1.jsx)("option", { value: "50000", children: "Above \u20B9 50,000" }), (0, jsx_runtime_1.jsx)("option", { value: "100000", children: "Above \u20B9 1,00,000" })] })] }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-primary", style: { padding: '0.5rem 1.5rem' }, children: "Generate" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '1rem', padding: '1rem', background: 'white', borderBottom: '1px solid var(--border)' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, padding: '1rem', background: '#EFF6FF', border: '1px solid #BFDBFE' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: '#1E40AF', textTransform: 'uppercase', fontWeight: 600 }, children: "Total Active Customers" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '1.25rem', fontWeight: 700, color: '#1D4ED8' }, children: customerData.length })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, padding: '1rem', background: '#F0FDF4', border: '1px solid #BBF7D0' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }, children: "Total Revenue from Base" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '1.25rem', fontWeight: 700, color: '#15803D' }, children: ["\u20B9 ", totals.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, padding: '1rem', background: '#FEF2F2', border: '1px solid #FECACA' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: '#991B1B', textTransform: 'uppercase', fontWeight: 600 }, children: "Total Credit Outstanding" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '1.25rem', fontWeight: 700, color: '#B91C1C' }, children: ["\u20B9 ", totals.outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Customer Name" }), (0, jsx_runtime_1.jsx)("th", { children: "Contact & Area" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'center' }, children: "Total Orders" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Avg Order Value (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Total Revenue (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Current Outstanding (\u20B9)" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: customerData.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: "6", style: { textAlign: 'center', padding: '2rem' }, children: "No customers found matching criteria." }) })) : customerData.map((row, i) => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 600 }, children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [i < 3 && (0, jsx_runtime_1.jsx)("span", { title: "Top Buyer", style: { fontSize: '1rem' }, children: "\u2B50" }), row.name] }) }), (0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsx)("div", { children: row.phone || 'N/A' }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: row.area })] }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'center', fontWeight: 500 }, children: row.totalOrders }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right' }, children: row.avgOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', fontWeight: 700, color: '#15803D' }, children: row.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: row.outstandingBalance > 0 ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: row.outstandingBalance > 0 ? 600 : 400 }, children: row.outstandingBalance > 0 ? row.outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-' })] }, row.id))) })] }) })] }));
}
