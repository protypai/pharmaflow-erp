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
exports.default = Outstanding;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
function Outstanding() {
    const [customers, set_customers] = (0, react_1.useState)([]);
    const [suppliers, set_suppliers] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchData = async () => {
            const res_customers = await window.pharmaAPI.db.query(`
        SELECT c.*,
               (SELECT SUM(net_amount) FROM sales WHERE customer_id = c.id) as totalBilled,
               (SELECT SUM(amount) FROM receipts WHERE customer_id = c.id) as totalPaid,
               (SELECT MIN(date) FROM sales WHERE customer_id = c.id AND (net_amount - paid_amount) > 0) as oldestDue
        FROM customers c
      `);
            set_customers(res_customers?.data || []);
            const res_suppliers = await window.pharmaAPI.db.query(`
        SELECT s.*,
               (SELECT SUM(net_amount) FROM purchases WHERE supplier_id = s.id) as totalBilled,
               (SELECT SUM(amount) FROM payments WHERE supplier_id = s.id) as totalPaid,
               (SELECT MIN(invoice_date) FROM purchases WHERE supplier_id = s.id AND (net_amount - paid_amount) > 0) as oldestDue
        FROM suppliers s
      `);
            set_suppliers(res_suppliers?.data || []);
        };
        fetchData();
    }, []);
    const [viewType, setViewType] = (0, react_1.useState)('receivables'); // 'receivables' or 'payables'
    const [search, setSearch] = (0, react_1.useState)('');
    const outstandingData = (0, react_1.useMemo)(() => {
        let data = [];
        if (viewType === 'receivables') {
            // Customers owe money TO the pharmacy
            data = customers.map(c => {
                const totalBilled = c.totalBilled || 0;
                const pendingAmt = (c.opening_balance || 0) + totalBilled - (c.totalPaid || 0);
                let oldestDueDays = 0;
                if (c.oldestDue) {
                    oldestDueDays = Math.ceil((new Date() - new Date(c.oldestDue)) / (1000 * 60 * 60 * 24));
                }
                return {
                    id: c.id,
                    partyName: c.name,
                    contact: c.phone || 'N/A',
                    city: c.area || c.city,
                    totalBilled,
                    pendingAmt,
                    oldestDueDays: Math.max(0, oldestDueDays),
                    status: oldestDueDays > (c.credit_days || 30) ? 'Overdue' : 'Normal'
                };
            }).filter(x => x.pendingAmt > 0);
        }
        else {
            // Pharmacy owes money TO suppliers
            data = suppliers.map(s => {
                const totalBilled = s.totalBilled || 0;
                const pendingAmt = (s.opening_balance || 0) + totalBilled - (s.totalPaid || 0);
                let oldestDueDays = 0;
                if (s.oldestDue) {
                    oldestDueDays = Math.ceil((new Date() - new Date(s.oldestDue)) / (1000 * 60 * 60 * 24));
                }
                return {
                    id: s.id,
                    partyName: s.name,
                    contact: s.contactPerson || s.phone || 'N/A',
                    city: s.city,
                    totalBilled,
                    pendingAmt,
                    oldestDueDays: Math.max(0, oldestDueDays),
                    status: oldestDueDays > (s.credit_days || 45) ? 'Overdue' : 'Normal'
                };
            }).filter(x => x.pendingAmt > 0);
        }
        if (search) {
            data = data.filter(d => d.partyName.toLowerCase().includes(search.toLowerCase()));
        }
        // Sort by highest pending amount first
        return data.sort((a, b) => b.pendingAmt - a.pendingAmt);
    }, [viewType, search]);
    const totalOutstanding = outstandingData.reduce((sum, d) => sum + d.pendingAmt, 0);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "card-title", children: "Outstanding (Receivables & Payables)" }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", children: "Track money owed to you and money you owe" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { size: 16 }), " Print Report"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", onClick: () => alert("Data exported successfully as CSV!"), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { size: 16 }), " Export CSV"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', borderBottom: '1px solid var(--border)' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn btn-ghost", style: {
                            borderRadius: 0,
                            borderBottom: viewType === 'receivables' ? '2px solid var(--primary)' : '2px solid transparent',
                            color: viewType === 'receivables' ? 'var(--primary)' : 'inherit',
                            padding: '1rem 2rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }, onClick: () => setViewType('receivables'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { size: 18 }), " Accounts Receivable (Customers Owe Us)"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-ghost", style: {
                            borderRadius: 0,
                            borderBottom: viewType === 'payables' ? '2px solid var(--danger)' : '2px solid transparent',
                            color: viewType === 'payables' ? 'var(--danger)' : 'inherit',
                            padding: '1rem 2rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }, onClick: () => setViewType('payables'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.TrendingDown, { size: 18 }), " Accounts Payable (We Owe Suppliers)"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "filter-bar", style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "search-input-wrap", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 16, className: "search-icon" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", placeholder: "Search Party Name...", value: search, onChange: e => setSearch(e.target.value), style: { width: '250px' } })] }), (0, jsx_runtime_1.jsxs)("div", { style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            background: viewType === 'receivables' ? '#EFF6FF' : '#FEF2F2',
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius)',
                            color: viewType === 'receivables' ? '#1E40AF' : '#991B1B'
                        }, children: [(0, jsx_runtime_1.jsxs)("span", { style: { fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }, children: ["Total ", viewType === 'receivables' ? 'Receivables' : 'Payables', ":"] }), (0, jsx_runtime_1.jsxs)("span", { style: { fontSize: '1.25rem', fontWeight: 700 }, children: ["\u20B9 ", totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: viewType === 'receivables' ? 'Customer Name' : 'Supplier Name' }), (0, jsx_runtime_1.jsx)("th", { children: "Contact & City" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Total Billed (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Pending Balance (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { children: "Oldest Due" }), (0, jsx_runtime_1.jsx)("th", { className: "col-actions", children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: outstandingData.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: "6", style: { textAlign: 'center', padding: '2rem' }, children: "No outstanding records found!" }) })) : outstandingData.map((row) => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 600 }, children: row.partyName }), (0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsx)("div", { children: row.contact }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: row.city })] }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: 'var(--text-secondary)' }, children: row.totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', fontWeight: 700, color: viewType === 'receivables' ? 'var(--primary)' : 'var(--danger)' }, children: row.pendingAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("span", { style: {
                                                background: row.status === 'Overdue' ? 'var(--danger)' : '#E2E8F0',
                                                color: row.status === 'Overdue' ? 'white' : 'var(--text-secondary)',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600
                                            }, children: [row.oldestDueDays, " Days"] }) }), (0, jsx_runtime_1.jsx)("td", { className: "col-actions", children: (0, jsx_runtime_1.jsx)("button", { className: "btn btn-outline btn-sm", title: viewType === 'receivables' ? "Send Payment Reminder" : "Plan Payment", children: viewType === 'receivables' ? 'Send Reminder' : 'Pay Now' }) })] }, row.id))) })] }) })] }));
}
