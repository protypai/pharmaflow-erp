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
exports.default = NearExpiry;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const react_router_dom_1 = require("react-router-dom");
function NearExpiry() {
    const [products, set_products] = (0, react_1.useState)([]);
    const [suppliers, set_suppliers] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchData = async () => {
            const res_products = await window.pharmaAPI.db.query("SELECT * FROM products");
            set_products(res_products?.data || []);
            const res_suppliers = await window.pharmaAPI.db.query("SELECT * FROM suppliers");
            set_suppliers(res_suppliers?.data || []);
        };
        fetchData();
    }, []);
    const navigate = (0, react_router_dom_1.useNavigate)();
    const [daysFilter, setDaysFilter] = (0, react_1.useState)('90'); // Default to 90 days
    // Mock function to determine if a batch is expiring within X days
    // Since mockData uses MM/YY, we'll simulate logic
    const getExpiringBatches = (0, react_1.useMemo)(() => {
        let expiring = [];
        const today = new Date();
        const currentYear = today.getFullYear() % 100;
        const currentMonth = today.getMonth() + 1;
        products.forEach(p => {
            p.batches.forEach(b => {
                if (!b.expiry || b.qty <= 0)
                    return;
                // Parse MM/YY
                const [mStr, yStr] = b.expiry.split('/');
                const expMonth = parseInt(mStr);
                const expYear = parseInt(yStr);
                // Calculate months difference
                const monthsDiff = ((expYear - currentYear) * 12) + (expMonth - currentMonth);
                const daysDiff = monthsDiff * 30; // rough estimation
                const filterDays = parseInt(daysFilter);
                // If it expires in the future but within our filter range
                if (daysDiff > 0 && daysDiff <= filterDays) {
                    expiring.push({
                        ...b,
                        productName: p.name,
                        productCode: p.code,
                        daysRemaining: daysDiff,
                        stockValue: b.qty * b.mrp * 0.7, // Mock PTR value
                        supplierName: suppliers[b.id % suppliers.length].name // Mock supplier
                    });
                }
            });
        });
        // Sort by most urgent (fewest days remaining)
        return expiring.sort((a, b) => a.daysRemaining - b.daysRemaining);
    }, [daysFilter]);
    const totalValueAtRisk = getExpiringBatches.reduce((sum, b) => sum + b.stockValue, 0);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", style: { background: '#FFF7ED', borderBottom: '1px solid #FFEDD5' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h2", { className: "card-title", style: { color: '#C2410C', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { size: 20 }), " Near Expiry Alert"] }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", style: { color: '#9A3412' }, children: "Monitor and return stock before it becomes dead capital" })] }), (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', gap: '0.5rem' }, children: (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", style: { borderColor: '#C2410C', color: '#C2410C' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { size: 16 }), " Print Report"] }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "filter-bar", children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", style: { marginBottom: 0 }, children: "Expires Within:" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: daysFilter, onChange: e => setDaysFilter(e.target.value), style: { width: '200px' }, children: [(0, jsx_runtime_1.jsx)("option", { value: "30", children: "Next 30 Days (Urgent)" }), (0, jsx_runtime_1.jsx)("option", { value: "60", children: "Next 60 Days" }), (0, jsx_runtime_1.jsx)("option", { value: "90", children: "Next 90 Days" }), (0, jsx_runtime_1.jsx)("option", { value: "180", children: "Next 6 Months" })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem', background: '#FEF2F2', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', color: 'var(--danger)' }, children: [(0, jsx_runtime_1.jsx)("span", { style: { fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }, children: "Value at Risk:" }), (0, jsx_runtime_1.jsxs)("span", { style: { fontSize: '1.2rem', fontWeight: 700 }, children: ["\u20B9 ", totalValueAtRisk.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Product" }), (0, jsx_runtime_1.jsx)("th", { children: "Batch" }), (0, jsx_runtime_1.jsx)("th", { children: "Available Qty" }), (0, jsx_runtime_1.jsx)("th", { children: "Expiry Date" }), (0, jsx_runtime_1.jsx)("th", { children: "Days Remaining" }), (0, jsx_runtime_1.jsx)("th", { children: "Supplier Name" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Stock Value (PTR)" }), (0, jsx_runtime_1.jsx)("th", { className: "col-actions", children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: getExpiringBatches.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsxs)("td", { colSpan: "8", style: { textAlign: 'center', padding: '2rem' }, children: ["No stock expiring within ", daysFilter, " days!"] }) })) : getExpiringBatches.map(b => ((0, jsx_runtime_1.jsxs)("tr", { style: { background: b.daysRemaining <= 30 ? '#FEF2F2' : 'transparent' }, children: [(0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 600 }, children: b.productName }), (0, jsx_runtime_1.jsx)("td", { children: b.batch }), (0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 600 }, children: b.qty }), (0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--danger)', fontWeight: 500 }, children: b.expiry }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("span", { style: {
                                                background: b.daysRemaining <= 30 ? 'var(--danger)' : '#EA580C',
                                                color: 'white',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600
                                            }, children: ["~", b.daysRemaining, " days"] }) }), (0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--text-secondary)' }, children: b.supplierName }), (0, jsx_runtime_1.jsxs)("td", { style: { textAlign: 'right', fontWeight: 500 }, children: ["\u20B9 ", b.stockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })] }), (0, jsx_runtime_1.jsx)("td", { className: "col-actions", children: (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline btn-sm", onClick: () => navigate('/transactions/purchase-return'), style: { borderColor: 'var(--primary)', color: 'var(--primary)' }, title: "Return to Supplier (Debit Note)", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRightLeft, { size: 14 }), " Return"] }) })] }, `${b.productCode}-${b.batch}`))) })] }) })] }));
}
