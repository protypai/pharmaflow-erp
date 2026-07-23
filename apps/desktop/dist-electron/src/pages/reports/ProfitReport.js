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
exports.default = ProfitReport;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
function ProfitReport() {
    const [products, set_products] = (0, react_1.useState)([]);
    const [categories, set_categories] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchData = async () => {
            const res_products = await window.pharmaAPI.db.query("SELECT * FROM products");
            set_products(res_products?.data || []);
            const res_categories = await window.pharmaAPI.db.query("SELECT * FROM categories");
            set_categories(res_categories?.data || []);
        };
        fetchData();
    }, []);
    const [groupBy, setGroupBy] = (0, react_1.useState)('product'); // 'product' or 'category'
    const [dateRange, setDateRange] = (0, react_1.useState)('this_month');
    // Mock Profit Data Calculation
    const profitData = (0, react_1.useMemo)(() => {
        let data = [];
        if (groupBy === 'product') {
            data = products.map(p => {
                // Mock sales volume for this period
                const qtySold = (p.id * 15) + 10;
                // Revenue is qty * MRP
                const salesRevenue = qtySold * p.mrp;
                // COGS (Cost of Goods Sold) is qty * PTR (we mocked PTR as 70% of MRP earlier)
                const ptr = p.mrp * 0.7;
                const cogs = qtySold * ptr;
                const grossProfit = salesRevenue - cogs;
                const marginPercent = salesRevenue > 0 ? (grossProfit / salesRevenue) * 100 : 0;
                return {
                    id: p.id,
                    entityName: p.name,
                    details: `${p.genericName} • ${p.manufacturer}`,
                    qtySold,
                    salesRevenue,
                    cogs,
                    grossProfit,
                    marginPercent
                };
            });
        }
        else if (groupBy === 'category') {
            data = categories.map(c => {
                // Find all products in this category to aggregate
                const catProducts = products.filter(p => p.categoryId === c.id);
                let totalQty = 0;
                let totalRevenue = 0;
                let totalCogs = 0;
                catProducts.forEach(p => {
                    const qty = (p.id * 15) + 10;
                    totalQty += qty;
                    totalRevenue += qty * p.mrp;
                    totalCogs += qty * (p.mrp * 0.7);
                });
                const grossProfit = totalRevenue - totalCogs;
                const marginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
                return {
                    id: c.id,
                    entityName: c.name,
                    details: `${catProducts.length} Products in category`,
                    qtySold: totalQty,
                    salesRevenue: totalRevenue,
                    cogs: totalCogs,
                    grossProfit,
                    marginPercent
                };
            });
        }
        // Sort by highest Gross Profit
        return data.sort((a, b) => b.grossProfit - a.grossProfit);
    }, [groupBy, dateRange]);
    const totals = profitData.reduce((acc, curr) => {
        acc.revenue += curr.salesRevenue;
        acc.cogs += curr.cogs;
        acc.gp += curr.grossProfit;
        return acc;
    }, { revenue: 0, cogs: 0, gp: 0 });
    const averageMargin = totals.revenue > 0 ? (totals.gp / totals.revenue) * 100 : 0;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", style: { background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h2", { className: "card-title", style: { color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.BarChart3, { size: 20 }), " Profit & Margin Analysis"] }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", style: { color: '#475569' }, children: "Track Gross Profit (GP) and margins to identify your most lucrative items" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { size: 16 }), " Print Report"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-primary", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { size: 16 }), " Export Excel"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "filter-bar", style: { display: 'flex', gap: '1rem', alignItems: 'flex-end', background: '#F8FAFC' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { width: '200px' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Date Range" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: dateRange, onChange: e => setDateRange(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "this_month", children: "This Month" }), (0, jsx_runtime_1.jsx)("option", { value: "last_month", children: "Last Month" }), (0, jsx_runtime_1.jsx)("option", { value: "this_quarter", children: "This Quarter" }), (0, jsx_runtime_1.jsx)("option", { value: "this_year", children: "This Financial Year" })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { width: '250px' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Group By" }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)("button", { className: `btn ${groupBy === 'product' ? 'btn-primary' : 'btn-outline'}`, style: { flex: 1 }, onClick: () => setGroupBy('product'), children: "By Product" }), (0, jsx_runtime_1.jsx)("button", { className: `btn ${groupBy === 'category' ? 'btn-primary' : 'btn-outline'}`, style: { flex: 1 }, onClick: () => setGroupBy('category'), children: "By Category" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '1rem', padding: '1rem', background: 'white', borderBottom: '1px solid var(--border)' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, padding: '1rem', background: '#F0FDF4', border: '1px solid #BBF7D0' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }, children: "Total Net Sales Revenue" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '1.25rem', fontWeight: 700, color: '#15803D' }, children: ["\u20B9 ", totals.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, padding: '1rem', background: '#FEF2F2', border: '1px solid #FECACA' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: '#991B1B', textTransform: 'uppercase', fontWeight: 600 }, children: "Cost of Goods Sold (COGS)" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '1.25rem', fontWeight: 700, color: '#B91C1C' }, children: ["\u20B9 ", totals.cogs.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, padding: '1rem', background: '#EFF6FF', border: '1px solid #BFDBFE' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: '#1E40AF', textTransform: 'uppercase', fontWeight: 600 }, children: "Total Gross Profit (GP)" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '1.25rem', fontWeight: 700, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: ["\u20B9 ", totals.gp.toLocaleString('en-IN', { minimumFractionDigits: 2 }), (0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { size: 20 })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, padding: '1rem', background: '#F5F3FF', border: '1px solid #DDD6FE' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: '#5B21B6', textTransform: 'uppercase', fontWeight: 600 }, children: "Average Margin %" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '1.25rem', fontWeight: 700, color: '#4C1D95' }, children: [averageMargin.toFixed(2), "%"] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: groupBy === 'product' ? 'Product Name' : 'Category Name' }), (0, jsx_runtime_1.jsx)("th", { children: "Details" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'center' }, children: "Qty Sold" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Sales Revenue (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "COGS (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Gross Profit (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Margin %" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: profitData.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: "7", style: { textAlign: 'center', padding: '2rem' }, children: "No profit data found for this period." }) })) : profitData.map((row, i) => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 600 }, children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [i < 3 && (0, jsx_runtime_1.jsx)("span", { title: "Top Contributor", style: { fontSize: '1rem' }, children: "\uD83D\uDD25" }), row.entityName] }) }), (0, jsx_runtime_1.jsx)("td", { style: { fontSize: '0.8rem', color: 'var(--text-secondary)' }, children: row.details }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'center', fontWeight: 500 }, children: row.qtySold }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: '#15803D' }, children: row.salesRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: 'var(--danger)' }, children: row.cogs.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', fontWeight: 700, color: '#1D4ED8' }, children: row.grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', fontWeight: 700 }, children: (0, jsx_runtime_1.jsxs)("span", { style: {
                                                background: row.marginPercent >= 30 ? '#DCFCE7' : (row.marginPercent >= 15 ? '#FEF9C3' : '#FEE2E2'),
                                                color: row.marginPercent >= 30 ? '#166534' : (row.marginPercent >= 15 ? '#854D0E' : '#991B1B'),
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '12px',
                                                fontSize: '0.8rem'
                                            }, children: [row.marginPercent.toFixed(1), "%"] }) })] }, row.id))) })] }) })] }));
}
