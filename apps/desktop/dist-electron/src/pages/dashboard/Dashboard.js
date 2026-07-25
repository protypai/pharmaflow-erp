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
exports.default = Dashboard;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
function Dashboard() {
    const [stats, setStats] = (0, react_1.useState)({
        todaySales: { amount: 0, count: 0 },
        todayPurchase: { amount: 0, count: 0 },
        todayCollections: { amount: 0, count: 0 },
        todayPayments: { amount: 0, count: 0 },
        cashBalance: 0,
        bankBalance: 0,
        outstandingReceivable: 0,
        outstandingPayable: 0,
        nearExpiry: 0,
        expiredStock: 0,
        lowStock: 0,
        outOfStock: 0,
        deadStock: 0,
        newCustomers: 0,
        pendingReturns: 0
    });
    (0, react_1.useEffect)(() => {
        const fetchStats = async () => {
            try {
                const today = new Date().toISOString().split('T')[0];
                const salesRes = await window.pharmaAPI.db.query(`SELECT COUNT(*) as count, SUM(net_amount) as total FROM sales WHERE date LIKE '${today}%'`);
                const purchRes = await window.pharmaAPI.db.query(`SELECT COUNT(*) as count, SUM(net_amount) as total FROM purchases WHERE invoice_date LIKE '${today}%'`);
                const collRes = await window.pharmaAPI.db.query(`SELECT COUNT(*) as count, SUM(amount) as total FROM receipts WHERE date LIKE '${today}%'`);
                const payRes = await window.pharmaAPI.db.query(`SELECT COUNT(*) as count, SUM(amount) as total FROM payments WHERE date LIKE '${today}%'`);
                const customersRes = await window.pharmaAPI.db.query("SELECT COUNT(*) as count FROM customers");
                const recRes = await window.pharmaAPI.db.query(`
          SELECT 
            COALESCE((SELECT SUM(opening_balance) FROM customers), 0) +
            COALESCE((SELECT SUM(net_amount) FROM sales), 0) -
            COALESCE((SELECT SUM(amount) FROM receipts), 0) as total
        `);
                const paybleRes = await window.pharmaAPI.db.query(`
          SELECT 
            COALESCE((SELECT SUM(opening_balance) FROM suppliers), 0) +
            COALESCE((SELECT SUM(net_amount) FROM purchases), 0) -
            COALESCE((SELECT SUM(amount) FROM payments), 0) as total
        `);
                const batchRes = await window.pharmaAPI.db.query("SELECT expiry_date, current_qty FROM batches");
                const batches = batchRes?.data || [];
                let nearExpiryCount = 0, expiredStockCount = 0;
                const now = new Date();
                batches.forEach(b => {
                    if (!b.expiry_date || b.current_qty <= 0)
                        return;
                    let expDate;
                    if (b.expiry_date.includes('/') && b.expiry_date.length === 5) {
                        const [m, y] = b.expiry_date.split('/');
                        expDate = new Date(2000 + parseInt(y), parseInt(m) - 1, 1);
                    }
                    else {
                        expDate = new Date(b.expiry_date);
                    }
                    if (isNaN(expDate))
                        return;
                    const daysDiff = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
                    if (daysDiff <= 0)
                        expiredStockCount++;
                    else if (daysDiff <= 90)
                        nearExpiryCount++;
                });
                const prodRes = await window.pharmaAPI.db.query(`
          SELECT p.min_stock, COALESCE(SUM(b.current_qty), 0) as totalQty
          FROM products p
          LEFT JOIN batches b ON p.id = b.product_id
          GROUP BY p.id
        `);
                let lowStockCount = 0, outOfStockCount = 0;
                (prodRes?.data || []).forEach(p => {
                    if (p.totalQty <= 0)
                        outOfStockCount++;
                    else if (p.totalQty < (p.min_stock || 10))
                        lowStockCount++;
                });
                const sales = salesRes?.data || [];
                const purch = purchRes?.data || [];
                const coll = collRes?.data || [];
                const paym = payRes?.data || [];
                const customers = customersRes?.data || [];
                setStats(prev => ({
                    ...prev,
                    todaySales: { amount: sales[0]?.total || 0, count: sales[0]?.count || 0 },
                    todayPurchase: { amount: purch[0]?.total || 0, count: purch[0]?.count || 0 },
                    todayCollections: { amount: coll[0]?.total || 0, count: coll[0]?.count || 0 },
                    todayPayments: { amount: paym[0]?.total || 0, count: paym[0]?.count || 0 },
                    newCustomers: customers[0]?.count || 0,
                    outstandingReceivable: recRes?.data?.[0]?.total || 0,
                    outstandingPayable: paybleRes?.data?.[0]?.total || 0,
                    nearExpiry: nearExpiryCount,
                    expiredStock: expiredStockCount,
                    lowStock: lowStockCount,
                    outOfStock: outOfStockCount,
                    deadStock: 0,
                    pendingReturns: 0
                }));
            }
            catch (err) {
                console.error('Failed to load DB stats', err);
            }
        };
        fetchStats();
    }, []);
    const salesTrend = [];
    const outstandingAging = [];
    const topProducts = [];
    const recentActivities = [];
    const { todaySales, todayPurchase, todayCollections, todayPayments, cashBalance, bankBalance, outstandingReceivable, outstandingPayable, nearExpiry, expiredStock, lowStock, outOfStock, deadStock, newCustomers, pendingReturns } = stats;
    const formatCurr = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { style: { fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }, children: "Today's Business" }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-grid", style: { gridTemplateColumns: 'repeat(4, 1fr)' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "kpi-card blue", children: [(0, jsx_runtime_1.jsx)("div", { className: "kpi-label", children: "Today's Sales" }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-value", children: formatCurr(todaySales.amount) }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-sub", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-success", style: { display: 'inline-flex', alignItems: 'center' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowUpRight, { size: 12 }), " 12%"] }), " vs yesterday"] }), (0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { size: 64, className: "kpi-icon", color: "var(--primary)" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-card purple", children: [(0, jsx_runtime_1.jsx)("div", { className: "kpi-label", children: "Today's Purchase" }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-value", children: formatCurr(todayPurchase.amount) }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-sub", children: [todayPurchase.count, " invoices processed"] }), (0, jsx_runtime_1.jsx)(lucide_react_1.ShoppingCart, { size: 64, className: "kpi-icon", color: "var(--purple)" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-card green", children: [(0, jsx_runtime_1.jsx)("div", { className: "kpi-label", children: "Collections Received" }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-value", children: formatCurr(todayCollections.amount) }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-sub", children: ["from ", todayCollections.count, " customers"] }), (0, jsx_runtime_1.jsx)(lucide_react_1.Receipt, { size: 64, className: "kpi-icon", color: "var(--success)" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-card orange", children: [(0, jsx_runtime_1.jsx)("div", { className: "kpi-label", children: "Payments Made" }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-value", children: formatCurr(todayPayments.amount) }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-sub", children: ["to ", todayPayments.count, " suppliers"] }), (0, jsx_runtime_1.jsx)(lucide_react_1.Wallet, { size: 64, className: "kpi-icon", color: "var(--warning)" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-grid", style: { gridTemplateColumns: 'repeat(4, 1fr)', marginTop: '-0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "kpi-card teal", children: [(0, jsx_runtime_1.jsx)("div", { className: "kpi-label", children: "Cash Balance" }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-value", children: formatCurr(cashBalance) }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-sub", children: "Available cash in hand" }), (0, jsx_runtime_1.jsx)(lucide_react_1.BadgeIndianRupee, { size: 64, className: "kpi-icon", color: "var(--info)" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-card teal", children: [(0, jsx_runtime_1.jsx)("div", { className: "kpi-label", children: "Bank Balance" }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-value", children: formatCurr(bankBalance) }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-sub", children: "Total across all accounts" }), (0, jsx_runtime_1.jsx)(lucide_react_1.Building2, { size: 64, className: "kpi-icon", color: "var(--info)" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-card green", children: [(0, jsx_runtime_1.jsx)("div", { className: "kpi-label", children: "Receivables (To Collect)" }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-value", children: formatCurr(outstandingReceivable) }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-sub", children: "Customer outstanding" }), (0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { size: 64, className: "kpi-icon", color: "var(--success)" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-card red", children: [(0, jsx_runtime_1.jsx)("div", { className: "kpi-label", children: "Payables (To Pay)" }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-value", children: formatCurr(outstandingPayable) }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-sub", children: "Supplier outstanding" }), (0, jsx_runtime_1.jsx)(lucide_react_1.TrendingDown, { size: 64, className: "kpi-icon", color: "var(--danger)" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { style: { fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }, children: "Action Required Alerts" }), (0, jsx_runtime_1.jsxs)("div", { className: "alert-grid", style: { gridTemplateColumns: 'repeat(7, 1fr)' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "alert-card orange", children: [(0, jsx_runtime_1.jsx)("div", { className: "alert-icon", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { size: 18 }) }), (0, jsx_runtime_1.jsx)("div", { className: "alert-count", children: nearExpiry }), (0, jsx_runtime_1.jsx)("div", { className: "alert-label", children: "Near Expiry" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "alert-card red", children: [(0, jsx_runtime_1.jsx)("div", { className: "alert-icon", children: (0, jsx_runtime_1.jsx)(lucide_react_1.ShieldAlert, { size: 18 }) }), (0, jsx_runtime_1.jsx)("div", { className: "alert-count", children: expiredStock }), (0, jsx_runtime_1.jsx)("div", { className: "alert-label", children: "Expired Stock" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "alert-card orange", children: [(0, jsx_runtime_1.jsx)("div", { className: "alert-icon", children: (0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { size: 18 }) }), (0, jsx_runtime_1.jsx)("div", { className: "alert-count", children: lowStock }), (0, jsx_runtime_1.jsx)("div", { className: "alert-label", children: "Low Stock" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "alert-card red", children: [(0, jsx_runtime_1.jsx)("div", { className: "alert-icon", children: (0, jsx_runtime_1.jsx)(lucide_react_1.XCircle, { size: 18 }) }), (0, jsx_runtime_1.jsx)("div", { className: "alert-count", children: outOfStock }), (0, jsx_runtime_1.jsx)("div", { className: "alert-label", children: "Out of Stock" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "alert-card purple", children: [(0, jsx_runtime_1.jsx)("div", { className: "alert-icon", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Package, { size: 18 }) }), (0, jsx_runtime_1.jsx)("div", { className: "alert-count", children: deadStock }), (0, jsx_runtime_1.jsx)("div", { className: "alert-label", children: "Dead Stock" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "alert-card blue", children: [(0, jsx_runtime_1.jsx)("div", { className: "alert-icon", children: (0, jsx_runtime_1.jsx)(lucide_react_1.UserPlus, { size: 18 }) }), (0, jsx_runtime_1.jsx)("div", { className: "alert-count", children: newCustomers }), (0, jsx_runtime_1.jsx)("div", { className: "alert-label", children: "New Customers" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "alert-card green", children: [(0, jsx_runtime_1.jsx)("div", { className: "alert-icon", children: (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowDownRight, { size: 18 }) }), (0, jsx_runtime_1.jsx)("div", { className: "alert-count", children: pendingReturns }), (0, jsx_runtime_1.jsx)("div", { className: "alert-label", children: "Pending Returns" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsx)("h3", { className: "card-title", children: "Today's Activity Feed" }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost btn-sm", children: "View All" })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", children: (0, jsx_runtime_1.jsx)("table", { className: "data-table", children: (0, jsx_runtime_1.jsx)("tbody", { children: recentActivities.map((act, i) => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { style: { width: '80px', fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: act.time }), (0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 500, color: 'var(--text-primary)' }, children: act.desc }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: act.party })] }), (0, jsx_runtime_1.jsxs)("td", { className: "col-amount", style: {
                                                        color: act.type === 'receipt' || act.type === 'sale' ? 'var(--success)' : 'var(--danger)'
                                                    }, children: [act.type === 'receipt' || act.type === 'sale' ? '+' : '-', formatCurr(act.amount)] })] }, i))) }) }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsx)("h3", { className: "card-title", children: "Customer Outstanding Aging" }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost btn-sm", children: "Full Report" })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body", children: (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem' }, children: outstandingAging.map((age, i) => ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }, children: [(0, jsx_runtime_1.jsx)("span", { style: { fontWeight: 500 }, children: age.label }), (0, jsx_runtime_1.jsx)("span", { style: { fontWeight: 600 }, children: formatCurr(age.value) })] }), (0, jsx_runtime_1.jsx)("div", { style: { height: '8px', background: 'var(--content-bg)', borderRadius: '4px', overflow: 'hidden' }, children: (0, jsx_runtime_1.jsx)("div", { style: {
                                                        height: '100%',
                                                        background: age.color,
                                                        width: `${(age.value / outstandingReceivable) * 100}%`
                                                    } }) })] }, i))) }) })] })] })] }));
}
