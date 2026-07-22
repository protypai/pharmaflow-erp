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
exports.default = LowStock;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const mockData_1 = require("../../data/mockData");
function LowStock() {
    const [mfgFilter, setMfgFilter] = (0, react_1.useState)('');
    // Calculate products that are below their minimum stock level
    const lowStockData = (0, react_1.useMemo)(() => {
        return mockData_1.products.map(p => {
            const totalQty = p.batches.reduce((acc, b) => acc + b.qty, 0);
            const deficit = p.minStock - totalQty;
            // Determine suggested order qty (usually deficit + buffer, or based on maxStock)
            // We'll mock it as (MaxStock - Current) or just double the deficit if maxStock isn't defined properly
            const suggestedOrder = (p.maxStock && p.maxStock > totalQty) ? (p.maxStock - totalQty) : (deficit > 0 ? deficit * 2 : 0);
            // Mock primary supplier for PO generation
            const primarySupplier = mockData_1.suppliers[p.id % mockData_1.suppliers.length].name;
            return {
                ...p,
                totalQty,
                deficit,
                suggestedOrder,
                primarySupplier
            };
        }).filter(p => p.deficit > 0)
            .filter(p => mfgFilter ? p.manufacturerId === parseInt(mfgFilter) : true)
            .sort((a, b) => b.deficit - a.deficit); // Sort by highest deficit first
    }, [mfgFilter]);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", style: { background: '#EFF6FF', borderBottom: '1px solid #DBEAFE' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h2", { className: "card-title", style: { color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.TrendingDown, { size: 20 }), " Low Stock (Re-Order Level)"] }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", style: { color: '#1E3A8A' }, children: "Products running below minimum stock. Generate Purchase Orders instantly." })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", style: { borderColor: '#1E40AF', color: '#1E40AF' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { size: 16 }), " Print Shortage List"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-primary", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FilePlus2, { size: 16 }), " Generate PO for All"] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "filter-bar", children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", style: { marginBottom: 0 }, children: "Filter by Manufacturer:" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: mfgFilter, onChange: e => setMfgFilter(e.target.value), style: { width: '250px' }, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "All Manufacturers" }), mockData_1.manufacturers.map(m => (0, jsx_runtime_1.jsx)("option", { value: m.id, children: m.name }, m.id))] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Item Code" }), (0, jsx_runtime_1.jsx)("th", { children: "Product Details" }), (0, jsx_runtime_1.jsx)("th", { children: "Min Stock" }), (0, jsx_runtime_1.jsx)("th", { children: "Current Stock" }), (0, jsx_runtime_1.jsx)("th", { style: { background: '#FEF2F2' }, children: "Deficit Qty" }), (0, jsx_runtime_1.jsx)("th", { style: { background: '#F0FDF4' }, children: "Suggested Order" }), (0, jsx_runtime_1.jsx)("th", { children: "Primary Supplier" }), (0, jsx_runtime_1.jsx)("th", { className: "col-actions", children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: lowStockData.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: "8", style: { textAlign: 'center', padding: '2rem' }, children: "All products are adequately stocked!" }) })) : lowStockData.map(p => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--text-secondary)', fontWeight: 500 }, children: p.code }), (0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 600, color: 'var(--text-primary)' }, children: p.name }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: [p.genericName, " \u2022 ", p.manufacturer] })] }), (0, jsx_runtime_1.jsxs)("td", { style: { fontWeight: 500 }, children: [p.minStock, " ", p.saleUnit] }), (0, jsx_runtime_1.jsxs)("td", { style: { fontWeight: 600, color: 'var(--danger)' }, children: [p.totalQty, " ", p.saleUnit] }), (0, jsx_runtime_1.jsxs)("td", { style: { background: '#FEF2F2', fontWeight: 600, color: 'var(--danger)' }, children: ["-", p.deficit, " ", p.saleUnit] }), (0, jsx_runtime_1.jsxs)("td", { style: { background: '#F0FDF4', fontWeight: 700, color: 'var(--success)' }, children: [p.suggestedOrder, " ", p.saleUnit] }), (0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--text-secondary)' }, children: p.primarySupplier }), (0, jsx_runtime_1.jsx)("td", { className: "col-actions", children: (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline btn-sm", title: "Generate Purchase Order", style: { borderColor: 'var(--primary)', color: 'var(--primary)' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FilePlus2, { size: 14 }), " Draft PO"] }) })] }, p.id))) })] }) })] }));
}
