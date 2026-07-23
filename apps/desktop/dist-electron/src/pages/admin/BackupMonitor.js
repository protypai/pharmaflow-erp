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
exports.default = BackupMonitor;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
function BackupMonitor() {
    const [adminCompanies, set_adminCompanies] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchData = async () => {
            set_adminCompanies([]);
        };
        fetchData();
    }, []);
    const [search, setSearch] = (0, react_1.useState)('');
    const [triggering, setTriggering] = (0, react_1.useState)(null);
    const filtered = adminCompanies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.city.toLowerCase().includes(search.toLowerCase()));
    const handleTrigger = (id) => {
        setTriggering(id);
        setTimeout(() => setTriggering(null), 1500);
    };
    const isOverdue = (dateStr) => {
        return dateStr.includes('2025-06') || dateStr.includes('2025-07-18') || dateStr.includes('2025-07-20');
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsx)("h2", { className: "card-title", style: { fontSize: '1.1rem' }, children: "Global Backup Monitor" }), (0, jsx_runtime_1.jsxs)("div", { className: "search-bar", children: [(0, jsx_runtime_1.jsxs)("div", { className: "search-input-wrap", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 16, className: "search-icon" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", placeholder: "Search companies...", value: search, onChange: e => setSearch(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", style: { color: 'var(--purple)', borderColor: 'var(--purple)' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { size: 16 }), " Refresh Status"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', padding: '1.25rem', borderBottom: '1px solid var(--border)', background: '#FAFAFA' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { background: 'white', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { padding: '0.75rem', background: 'var(--success-light)', color: 'var(--success-dark)', borderRadius: '50%' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { size: 24 }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }, children: "3" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }, children: "Healthy Backups Today" })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { background: 'white', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { padding: '0.75rem', background: 'var(--warning-light)', color: 'var(--warning-dark)', borderRadius: '50%' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { size: 24 }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }, children: "2" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }, children: "Overdue (> 24 hours)" })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { background: 'white', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { padding: '0.75rem', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '50%' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.ShieldAlert, { size: 24 }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }, children: "1" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }, children: "Critical (> 3 days)" })] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Company Name" }), (0, jsx_runtime_1.jsx)("th", { children: "Location" }), (0, jsx_runtime_1.jsx)("th", { children: "Last Backup Time" }), (0, jsx_runtime_1.jsx)("th", { children: "Status" }), (0, jsx_runtime_1.jsx)("th", { children: "DB Size" }), (0, jsx_runtime_1.jsx)("th", { className: "col-actions", children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: filtered.map(company => {
                                const overdue = isOverdue(company.lastBackup);
                                const critical = company.lastBackup.includes('2025-06');
                                return ((0, jsx_runtime_1.jsxs)("tr", { style: { background: critical ? 'var(--danger-light)' : overdue ? 'var(--warning-light)' : 'transparent' }, children: [(0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 500, color: 'var(--text-primary)' }, children: company.name }), (0, jsx_runtime_1.jsx)("td", { children: company.city }), (0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 500 }, children: company.lastBackup.split(' ')[0] }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: company.lastBackup.split(' ').slice(1).join(' ') })] }), (0, jsx_runtime_1.jsx)("td", { children: critical ? ((0, jsx_runtime_1.jsx)("span", { className: "badge badge-danger", children: "Critical" })) : overdue ? ((0, jsx_runtime_1.jsx)("span", { className: "badge badge-warning", children: "Overdue" })) : ((0, jsx_runtime_1.jsx)("span", { className: "badge badge-success", children: "Healthy" })) }), (0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 500 }, children: company.dbSize }), (0, jsx_runtime_1.jsx)("td", { className: "col-actions", children: (0, jsx_runtime_1.jsxs)("button", { className: `btn btn-sm ${triggering === company.id ? 'btn-success' : 'btn-outline'}`, onClick: () => handleTrigger(company.id), disabled: triggering === company.id, style: triggering === company.id ? {} : { color: 'var(--purple)', borderColor: 'var(--purple)' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Database, { size: 14 }), triggering === company.id ? 'Triggered!' : 'Force Backup'] }) })] }, company.id));
                            }) })] }) })] }));
}
