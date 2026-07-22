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
exports.default = StockReport;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const mockData_1 = require("../../data/mockData");
function StockReport() {
    const [catFilter, setCatFilter] = (0, react_1.useState)('');
    const [mfgFilter, setMfgFilter] = (0, react_1.useState)('');
    const [statusFilter, setStatusFilter] = (0, react_1.useState)('all');
    const stockData = (0, react_1.useMemo)(() => {
        let data = mockData_1.products.map(p => {
            let totalQty = 0;
            p.batches.forEach(b => { totalQty += b.qty; });
            const avgPtr = 150; // Mock PTR for demo
            const stockValue = totalQty * avgPtr;
            return {
                ...p,
                totalQty,
                avgPtr,
                stockValue,
                status: totalQty <= 0 ? 'Out of Stock' : (totalQty < p.minStock ? 'Low Stock' : 'In Stock')
            };
        });
        if (catFilter)
            data = data.filter(d => d.categoryId === parseInt(catFilter));
        if (mfgFilter)
            data = data.filter(d => d.manufacturerId === parseInt(mfgFilter));
        if (statusFilter === 'in_stock')
            data = data.filter(d => d.totalQty > 0);
        if (statusFilter === 'out_of_stock')
            data = data.filter(d => d.totalQty <= 0);
        if (statusFilter === 'low_stock')
            data = data.filter(d => d.status === 'Low Stock');
        return data;
    }, [catFilter, mfgFilter, statusFilter]);
    const totals = stockData.reduce((acc, curr) => {
        acc.qty += curr.totalQty;
        acc.value += curr.stockValue;
        return acc;
    }, { qty: 0, value: 0 });
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "card-title", children: "Stock Statement (Valuation Report)" }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", children: "Audit physical vs system stock and total warehouse valuation" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", onClick: () => window.print(), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { size: 16 }), " Print"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { size: 16 }), " Export Excel"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "filter-bar", style: { display: 'flex', gap: '1rem', alignItems: 'flex-end', background: '#F8FAFC' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Category" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: catFilter, onChange: e => setCatFilter(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "All Categories" }), mockData_1.categories.map(c => (0, jsx_runtime_1.jsx)("option", { value: c.id, children: c.name }, c.id))] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Manufacturer" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: mfgFilter, onChange: e => setMfgFilter(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "All Manufacturers" }), mockData_1.manufacturers.map(m => (0, jsx_runtime_1.jsx)("option", { value: m.id, children: m.name }, m.id))] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Stock Status" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: statusFilter, onChange: e => setStatusFilter(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "all", children: "All Items" }), (0, jsx_runtime_1.jsx)("option", { value: "in_stock", children: "In Stock (> 0)" }), (0, jsx_runtime_1.jsx)("option", { value: "low_stock", children: "Low Stock (Below Min)" }), (0, jsx_runtime_1.jsx)("option", { value: "out_of_stock", children: "Out of Stock (0)" })] })] }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-primary", style: { padding: '0.5rem 1.5rem' }, children: "Generate" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'flex-end', padding: '0.5rem 1.5rem', background: '#F1F5F9', borderBottom: '1px solid var(--border)', gap: '2rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { textAlign: 'right' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }, children: "Total SKUs" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '1.2rem', fontWeight: 700 }, children: stockData.length })] }), (0, jsx_runtime_1.jsxs)("div", { style: { textAlign: 'right' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }, children: "Total Physical Units" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '1.2rem', fontWeight: 700 }, children: totals.qty.toLocaleString('en-IN') })] }), (0, jsx_runtime_1.jsxs)("div", { style: { textAlign: 'right', color: 'var(--primary)' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }, children: "Total Godown Value" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '1.2rem', fontWeight: 700 }, children: ["\u20B9 ", totals.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Item Code" }), (0, jsx_runtime_1.jsx)("th", { children: "Product Name" }), (0, jsx_runtime_1.jsx)("th", { children: "Category" }), (0, jsx_runtime_1.jsx)("th", { children: "Manufacturer" }), (0, jsx_runtime_1.jsx)("th", { children: "Rack" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'center' }, children: "Available Qty" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Avg Unit Cost (PTR)" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Total Value (\u20B9)" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: stockData.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: "8", style: { textAlign: 'center', padding: '2rem' }, children: "No stock data matching filters." }) })) : stockData.map((row) => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--text-secondary)' }, children: row.code }), (0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 600 }, children: row.name }), (0, jsx_runtime_1.jsx)("td", { children: row.category }), (0, jsx_runtime_1.jsx)("td", { style: { fontSize: '0.85rem' }, children: row.manufacturer }), (0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--text-secondary)' }, children: row.rack }), (0, jsx_runtime_1.jsxs)("td", { style: { textAlign: 'center', fontWeight: 700, color: row.totalQty === 0 ? 'var(--danger)' : 'inherit' }, children: [row.totalQty, " ", row.saleUnit] }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right' }, children: row.avgPtr.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }, children: row.stockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 }) })] }, row.id))) })] }) })] }));
}
