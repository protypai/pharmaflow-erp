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
exports.default = DeadStock;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
function DeadStock() {
    const [products, set_products] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchData = async () => {
            const res_products = await window.pharmaAPI.db.query(`
        SELECT p.*,
        (SELECT MAX(s.date) FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE si.product_id = p.id) as lastSaleDate,
        json_group_array(json_object(
          'id', b.id, 'batch', b.batch_no, 'expiry', b.expiry_date,
          'mrp', b.mrp, 'ptr', b.ptr, 'qty', b.current_qty
        )) as batches
        FROM products p
        LEFT JOIN batches b ON p.id = b.product_id
        GROUP BY p.id
      `);
            const formattedProducts = (res_products?.data || []).map(p => ({
                ...p,
                batches: p.batches && typeof p.batches === 'string'
                    ? JSON.parse(p.batches).filter(b => b.id)
                    : []
            }));
            set_products(formattedProducts);
        };
        fetchData();
    }, []);
    const [daysFilter, setDaysFilter] = (0, react_1.useState)('180');
    const deadStockData = (0, react_1.useMemo)(() => {
        return products.map(p => {
            const totalQty = p.batches.reduce((acc, b) => acc + (b.qty || 0), 0);
            let daysSinceLastSale = 9999; // Fallback if never sold
            let lastSaleDateStr = 'Never Sold';
            if (p.lastSaleDate) {
                lastSaleDateStr = p.lastSaleDate;
                daysSinceLastSale = Math.floor((new Date() - new Date(p.lastSaleDate)) / (1000 * 60 * 60 * 24));
            }
            // Calculate locked capital (PTR * Qty)
            const lockedCapital = p.batches.reduce((acc, b) => acc + ((b.qty || 0) * (b.ptr || 0)), 0);
            return {
                ...p,
                totalQty,
                daysSinceLastSale,
                lastSaleDateStr,
                lockedCapital
            };
        }).filter(p => p.totalQty > 0 && p.daysSinceLastSale >= parseInt(daysFilter))
            .sort((a, b) => b.lockedCapital - a.lockedCapital); // Sort by highest locked capital first
    }, [daysFilter, products]);
    const totalLockedCapital = deadStockData.reduce((sum, p) => sum + p.lockedCapital, 0);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", style: { background: '#F3F4F6', borderBottom: '1px solid #E5E7EB' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h2", { className: "card-title", style: { color: '#4B5563', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Ghost, { size: 20 }), " Dead Stock (Non-Moving)"] }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", style: { color: '#6B7280' }, children: "Identify inventory that isn't selling to free up locked capital" })] }), (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', gap: '0.5rem' }, children: (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { size: 16 }), " Print Report"] }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "filter-bar", children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", style: { marginBottom: 0 }, children: "No sales in last:" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: daysFilter, onChange: e => setDaysFilter(e.target.value), style: { width: '200px' }, children: [(0, jsx_runtime_1.jsx)("option", { value: "60", children: "60 Days" }), (0, jsx_runtime_1.jsx)("option", { value: "90", children: "90 Days" }), (0, jsx_runtime_1.jsx)("option", { value: "180", children: "6 Months" }), (0, jsx_runtime_1.jsx)("option", { value: "365", children: "1 Year" })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem', background: '#F3F4F6', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', color: '#374151' }, children: [(0, jsx_runtime_1.jsx)("span", { style: { fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }, children: "Total Locked Capital:" }), (0, jsx_runtime_1.jsxs)("span", { style: { fontSize: '1.2rem', fontWeight: 700 }, children: ["\u20B9 ", totalLockedCapital.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Item Code" }), (0, jsx_runtime_1.jsx)("th", { children: "Product Details" }), (0, jsx_runtime_1.jsx)("th", { children: "Available Qty" }), (0, jsx_runtime_1.jsx)("th", { children: "Last Sale Date" }), (0, jsx_runtime_1.jsx)("th", { children: "Days Idle" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Locked Capital (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { className: "col-actions", children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: deadStockData.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: "7", style: { textAlign: 'center', padding: '2rem' }, children: "No dead stock found for this timeframe!" }) })) : deadStockData.map(p => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--text-secondary)', fontWeight: 500 }, children: p.code }), (0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 600, color: 'var(--text-primary)' }, children: p.name }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: [p.genericName, " \u2022 ", p.manufacturer] })] }), (0, jsx_runtime_1.jsxs)("td", { style: { fontWeight: 600 }, children: [p.totalQty, " ", p.saleUnit] }), (0, jsx_runtime_1.jsx)("td", { children: p.lastSaleDateStr }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("span", { style: {
                                                background: p.daysSinceLastSale > 365 ? 'var(--danger)' : '#6B7280',
                                                color: 'white',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600
                                            }, children: p.daysSinceLastSale === 9999 ? 'No Sales' : `${p.daysSinceLastSale} days` }) }), (0, jsx_runtime_1.jsxs)("td", { style: { textAlign: 'right', fontWeight: 600, color: '#374151' }, children: ["\u20B9 ", p.lockedCapital.toLocaleString('en-IN', { minimumFractionDigits: 2 })] }), (0, jsx_runtime_1.jsx)("td", { className: "col-actions", children: (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline btn-sm", title: "Apply Discount / Push Sale", onClick: () => alert(`Pushing sale for ${p.name}`), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowDownToLine, { size: 14 }), " Push Sale"] }) })] }, p.id))) })] }) })] }));
}
