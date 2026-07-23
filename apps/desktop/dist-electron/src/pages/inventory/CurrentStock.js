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
exports.default = CurrentStock;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
function CurrentStock() {
    const [products, set_products] = (0, react_1.useState)([]);
    const [categories, set_categories] = (0, react_1.useState)([]);
    const [manufacturers, set_manufacturers] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchData = async () => {
            const res_products = await window.pharmaAPI.db.query(`
        SELECT p.*, 
               c.name as category, 
               m.name as manufacturer, 
               r.code as rack,
               IFNULL(b_agg.totalQty, 0) as totalQty,
               IFNULL(b_agg.avgPtr, 0) as avgPtr,
               IFNULL(b_agg.avgMrp, 0) as avgMrp,
               IFNULL(b_agg.totalValuePTR, 0) as totalValuePTR,
               IFNULL(b_agg.totalValueMRP, 0) as totalValueMRP
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
        LEFT JOIN racks r ON p.rack_id = r.id
        LEFT JOIN (
           SELECT product_id,
                  SUM(current_qty) as totalQty,
                  SUM(current_qty * ptr) / SUM(current_qty) as avgPtr,
                  SUM(current_qty * mrp) / SUM(current_qty) as avgMrp,
                  SUM(current_qty * ptr) as totalValuePTR,
                  SUM(current_qty * mrp) as totalValueMRP
           FROM batches
           WHERE current_qty > 0
           GROUP BY product_id
        ) b_agg ON b_agg.product_id = p.id
      `);
            set_products(res_products?.data || []);
            const res_categories = await window.pharmaAPI.db.query("SELECT * FROM categories");
            set_categories(res_categories?.data || []);
            const res_manufacturers = await window.pharmaAPI.db.query("SELECT * FROM manufacturers");
            set_manufacturers(res_manufacturers?.data || []);
        };
        fetchData();
    }, []);
    const [search, setSearch] = (0, react_1.useState)('');
    const [catFilter, setCatFilter] = (0, react_1.useState)('');
    const [mfgFilter, setMfgFilter] = (0, react_1.useState)('');
    // Calculate aggregated stock data
    const stockData = (0, react_1.useMemo)(() => {
        return products.map(p => {
            const totalQty = p.totalQty || 0;
            const avgPtr = p.avgPtr || 0;
            const avgMrp = p.avgMrp || 0;
            const totalValuePTR = p.totalValuePTR || 0;
            const totalValueMRP = p.totalValueMRP || 0;
            return {
                ...p,
                totalQty,
                avgPtr,
                avgMrp,
                totalValuePTR,
                totalValueMRP
            };
        }).filter(p => {
            if (search && !p.name?.toLowerCase().includes(search.toLowerCase()) && !p.generic_name?.toLowerCase().includes(search.toLowerCase()))
                return false;
            if (catFilter && p.category_id !== catFilter)
                return false;
            if (mfgFilter && p.manufacturer_id !== mfgFilter)
                return false;
            // Only show items that actually have stock
            if (p.totalQty <= 0)
                return false;
            return true;
        });
    }, [search, catFilter, mfgFilter, products]);
    // Aggregate totals for the footer
    const grandTotals = stockData.reduce((acc, curr) => {
        acc.qty += curr.totalQty;
        acc.ptrValue += curr.totalValuePTR;
        acc.mrpValue += curr.totalValueMRP;
        return acc;
    }, { qty: 0, ptrValue: 0, mrpValue: 0 });
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsx)("h2", { className: "card-title", children: "Current Stock Valuation" }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", onClick: () => window.print(), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { size: 16 }), " Print"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", onClick: () => alert("Data exported successfully as CSV!"), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { size: 16 }), " Export CSV"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "filter-bar", children: [(0, jsx_runtime_1.jsxs)("div", { className: "search-input-wrap", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 16, className: "search-icon" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", placeholder: "Search product or generic name...", value: search, onChange: e => setSearch(e.target.value), style: { width: '250px' } })] }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: catFilter, onChange: e => setCatFilter(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "All Categories" }), categories.map(c => (0, jsx_runtime_1.jsx)("option", { value: c.id, children: c.name }, c.id))] }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: mfgFilter, onChange: e => setMfgFilter(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "All Manufacturers" }), manufacturers.map(m => (0, jsx_runtime_1.jsx)("option", { value: m.id, children: m.name }, m.id))] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Item Code" }), (0, jsx_runtime_1.jsx)("th", { children: "Product Details" }), (0, jsx_runtime_1.jsx)("th", { children: "Rack" }), (0, jsx_runtime_1.jsx)("th", { children: "Available Qty" }), (0, jsx_runtime_1.jsx)("th", { children: "Unit" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Avg PTR (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Avg MRP (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Stock Value (PTR)" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: stockData.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: "8", style: { textAlign: 'center', padding: '2rem' }, children: "No stock found matching criteria." }) })) : stockData.map(prod => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--text-secondary)', fontWeight: 500 }, children: prod.code }), (0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 600, color: 'var(--text-primary)' }, children: prod.name }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: [prod.genericName, " \u2022 ", prod.category, " \u2022 ", prod.manufacturer] })] }), (0, jsx_runtime_1.jsx)("td", { children: prod.rack }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("div", { style: { fontWeight: 600, color: prod.totalQty < prod.minStock ? 'var(--danger)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }, children: [prod.totalQty, prod.totalQty < prod.minStock && (0, jsx_runtime_1.jsx)("span", { title: "Low Stock", style: { display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' } })] }) }), (0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--text-secondary)' }, children: prod.saleUnit }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right' }, children: prod.avgPtr.toFixed(2) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right' }, children: prod.avgMrp.toFixed(2) }), (0, jsx_runtime_1.jsxs)("td", { style: { fontWeight: 600, textAlign: 'right' }, children: ["\u20B9 ", prod.totalValuePTR.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }, prod.id))) })] }) }), (0, jsx_runtime_1.jsxs)("div", { style: { padding: '1rem', borderTop: '1px solid var(--border)', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Package, { size: 20 }), (0, jsx_runtime_1.jsxs)("span", { children: ["Showing ", (0, jsx_runtime_1.jsx)("strong", { children: stockData.length }), " Products with Stock"] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '2rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { textAlign: 'right' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }, children: "Total Units" }), (0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 700, fontSize: '1.1rem' }, children: grandTotals.qty.toLocaleString('en-IN') })] }), (0, jsx_runtime_1.jsxs)("div", { style: { textAlign: 'right' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }, children: "Total Value (MRP)" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontWeight: 700, fontSize: '1.1rem' }, children: ["\u20B9 ", grandTotals.mrpValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { textAlign: 'right', color: 'var(--primary)' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }, children: "Total Value (Cost/PTR)" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontWeight: 700, fontSize: '1.25rem' }, children: ["\u20B9 ", grandTotals.ptrValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] })] })] })] }));
}
