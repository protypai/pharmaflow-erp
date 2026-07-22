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
exports.default = ExpiredStock;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const mockData_1 = require("../../data/mockData");
const react_router_dom_1 = require("react-router-dom");
function ExpiredStock() {
    const navigate = (0, react_router_dom_1.useNavigate)();
    // Mock function to determine if a batch is ALREADY expired
    const getExpiredBatches = (0, react_1.useMemo)(() => {
        let expired = [];
        const today = new Date();
        const currentYear = today.getFullYear() % 100;
        const currentMonth = today.getMonth() + 1;
        mockData_1.products.forEach(p => {
            p.batches.forEach(b => {
                if (!b.expiry || b.qty <= 0)
                    return;
                // Parse MM/YY
                const [mStr, yStr] = b.expiry.split('/');
                const expMonth = parseInt(mStr);
                const expYear = parseInt(yStr);
                // Calculate months difference
                const monthsDiff = ((expYear - currentYear) * 12) + (expMonth - currentMonth);
                // If it expired in the past (monthsDiff < 0) or expires this exact month (monthsDiff === 0)
                if (monthsDiff <= 0) {
                    expired.push({
                        ...b,
                        productName: p.name,
                        productCode: p.code,
                        stockValue: b.qty * b.mrp * 0.7, // Mock PTR value
                        supplierName: mockData_1.suppliers[b.id % mockData_1.suppliers.length].name // Mock supplier
                    });
                }
            });
        });
        return expired;
    }, []);
    const totalFinancialLoss = getExpiredBatches.reduce((sum, b) => sum + b.stockValue, 0);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", style: { background: '#FEF2F2', borderBottom: '1px solid #FEE2E2' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h2", { className: "card-title", style: { color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShieldAlert, { size: 20 }), " Expired Stock (Locked)"] }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", style: { color: '#7F1D1D' }, children: "This stock is legally locked from sales billing. Action required." })] }), (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', gap: '0.5rem' }, children: (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", style: { borderColor: '#991B1B', color: '#991B1B' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { size: 16 }), " Print Damage Report"] }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "filter-bar", style: { display: 'flex', justifyContent: 'space-between' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }, children: "Showing all batches expired before current month." }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem', background: '#991B1B', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', color: 'white' }, children: [(0, jsx_runtime_1.jsx)("span", { style: { fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }, children: "Total Financial Loss:" }), (0, jsx_runtime_1.jsxs)("span", { style: { fontSize: '1.2rem', fontWeight: 700 }, children: ["\u20B9 ", totalFinancialLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Product" }), (0, jsx_runtime_1.jsx)("th", { children: "Batch" }), (0, jsx_runtime_1.jsx)("th", { children: "Locked Qty" }), (0, jsx_runtime_1.jsx)("th", { children: "Expired Date" }), (0, jsx_runtime_1.jsx)("th", { children: "Supplier Name" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Loss Value (PTR)" }), (0, jsx_runtime_1.jsx)("th", { className: "col-actions", children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: getExpiredBatches.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: "7", style: { textAlign: 'center', padding: '2rem' }, children: "No expired stock! Excellent inventory management." }) })) : getExpiredBatches.map(b => ((0, jsx_runtime_1.jsxs)("tr", { style: { background: '#FFF1F2' }, children: [(0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 600 }, children: b.productName }), (0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 600, color: 'var(--danger)' }, children: b.batch }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("span", { style: {
                                                background: 'var(--danger)',
                                                color: 'white',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600
                                            }, children: [b.qty, " Locked"] }) }), (0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--danger)', fontWeight: 600 }, children: b.expiry }), (0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--text-secondary)' }, children: b.supplierName }), (0, jsx_runtime_1.jsxs)("td", { style: { textAlign: 'right', fontWeight: 600, color: '#991B1B' }, children: ["\u20B9 ", b.stockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })] }), (0, jsx_runtime_1.jsx)("td", { className: "col-actions", children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline btn-sm", onClick: () => navigate('/transactions/purchase-return'), title: "Return to Supplier (Debit Note)", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRightLeft, { size: 14 }), " Return"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline btn-sm", onClick: () => navigate('/transactions/stock-adjustment'), style: { color: 'var(--danger)', borderColor: 'var(--danger)' }, title: "Write-off / Destroy (Stock Adjustment)", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { size: 14 }), " Write-off"] })] }) })] }, `${b.productCode}-${b.batch}`))) })] }) })] }));
}
