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
exports.default = SalesReport;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
function SalesReport() {
    const [customers, set_customers] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchData = async () => {
            const res_customers = await window.pharmaAPI.db.query("SELECT * FROM customers");
            set_customers(res_customers?.data || []);
        };
        fetchData();
    }, []);
    const [dateRange, setDateRange] = (0, react_1.useState)('this_month');
    const [customerId, setCustomerId] = (0, react_1.useState)('');
    const [salesData, setSalesData] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchSales = async () => {
            try {
                const query = `
          SELECT s.date, s.invoice_no as id, c.name as customerName, s.subtotal as gross, 
                 s.discount_amount as discount, (s.cgst_amount + s.sgst_amount + s.igst_amount) as gst, 
                 s.net_amount as net, 
                 (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items
          FROM sales s
          LEFT JOIN customers c ON s.customer_id = c.id
          ${customerId ? `WHERE s.customer_id = '${customerId}'` : ''}
          ORDER BY s.date DESC
        `;
                const res = await window.pharmaAPI.db.query(query);
                setSalesData(res?.data || []);
            }
            catch (err) {
                console.error("Failed to fetch sales data:", err);
            }
        };
        fetchSales();
    }, [customerId, dateRange]);
    const totals = salesData.reduce((acc, curr) => {
        acc.gross += curr.gross;
        acc.discount += curr.discount;
        acc.gst += curr.gst;
        acc.net += curr.net;
        return acc;
    }, { gross: 0, discount: 0, gst: 0, net: 0 });
    const avgOrderValue = salesData.length > 0 ? totals.net / salesData.length : 0;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "card-title", children: "Sales Report (Revenue Analysis)" }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", children: "Track daily/monthly revenue trends and invoice details" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", onClick: () => window.print(), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { size: 16 }), " Print"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", onClick: () => alert("Data exported successfully as CSV!"), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { size: 16 }), " Export CSV"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "filter-bar", style: { display: 'flex', gap: '1rem', alignItems: 'flex-end', background: '#F8FAFC' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { width: '200px' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Date Range" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: dateRange, onChange: e => setDateRange(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "today", children: "Today" }), (0, jsx_runtime_1.jsx)("option", { value: "this_week", children: "This Week" }), (0, jsx_runtime_1.jsx)("option", { value: "this_month", children: "This Month" }), (0, jsx_runtime_1.jsx)("option", { value: "last_month", children: "Last Month" }), (0, jsx_runtime_1.jsx)("option", { value: "custom", children: "Custom Range..." })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { flex: 1, maxWidth: '300px' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Filter by Customer" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: customerId, onChange: e => setCustomerId(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "All Customers" }), customers.map(c => (0, jsx_runtime_1.jsx)("option", { value: c.id, children: c.name }, c.id))] })] }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-primary", style: { padding: '0.5rem 1.5rem' }, children: "Generate" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '1rem', padding: '1rem', background: 'white', borderBottom: '1px solid var(--border)' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, padding: '1rem', background: '#EFF6FF', border: '1px solid #BFDBFE' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: '#1E40AF', textTransform: 'uppercase', fontWeight: 600 }, children: "Total Invoices" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '1.25rem', fontWeight: 700, color: '#1D4ED8' }, children: salesData.length })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, padding: '1rem', background: '#F0FDF4', border: '1px solid #BBF7D0' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }, children: "Total Revenue (Net)" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '1.25rem', fontWeight: 700, color: '#15803D' }, children: ["\u20B9 ", totals.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, padding: '1rem', background: '#FFF7ED', border: '1px solid #FED7AA' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: '#9A3412', textTransform: 'uppercase', fontWeight: 600 }, children: "Total Output GST" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '1.25rem', fontWeight: 700, color: '#C2410C' }, children: ["\u20B9 ", totals.gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, padding: '1rem', background: '#F8FAFC', border: '1px solid #E2E8F0' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', fontWeight: 600 }, children: "Average Order Value" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '1.25rem', fontWeight: 700, color: '#334155' }, children: ["\u20B9 ", avgOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { style: { width: '120px' }, children: "Date" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '150px' }, children: "Invoice No" }), (0, jsx_runtime_1.jsx)("th", { children: "Customer Name" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '80px', textAlign: 'center' }, children: "Items" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '120px', textAlign: 'right' }, children: "Gross (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '120px', textAlign: 'right' }, children: "Discount (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '120px', textAlign: 'right' }, children: "GST (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '150px', textAlign: 'right' }, children: "Net Amount (\u20B9)" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: salesData.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: "8", style: { textAlign: 'center', padding: '2rem' }, children: "No sales found for this period." }) })) : salesData.map((row) => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { children: row.date }), (0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }, children: row.id }), (0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 500 }, children: row.customerName }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'center', color: 'var(--text-secondary)' }, children: row.items }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right' }, children: row.gross.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: 'var(--danger)' }, children: row.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right' }, children: row.gst.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', fontWeight: 700, color: '#15803D' }, children: row.net.toLocaleString('en-IN', { minimumFractionDigits: 2 }) })] }, row.id))) }), (0, jsx_runtime_1.jsx)("tfoot", { style: { position: 'sticky', bottom: 0, background: '#F1F5F9', fontWeight: 700 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { colSpan: "4", style: { textAlign: 'right' }, children: "Grand Total:" }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right' }, children: totals.gross.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: 'var(--danger)' }, children: totals.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right' }, children: totals.gst.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsxs)("td", { style: { textAlign: 'right', color: '#15803D', fontSize: '1.1rem' }, children: ["\u20B9 ", totals.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }) })] }) })] }));
}
