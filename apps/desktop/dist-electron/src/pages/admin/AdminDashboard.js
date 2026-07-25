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
exports.default = AdminDashboard;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const api_1 = require("../../config/api");
function AdminDashboard() {
    const [adminCompanies, set_adminCompanies] = (0, react_1.useState)([]);
    const [adminActivityLogs, set_adminActivityLogs] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                if (!token)
                    return;
                const res = await fetch(`${api_1.API_BASE_URL}/api/v1/admin/companies`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success && data.data) {
                    set_adminCompanies(data.data);
                }
                const logsRes = await fetch(`${api_1.API_BASE_URL}/api/v1/admin/activity-logs`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const logsData = await logsRes.json();
                if (logsData.success && logsData.data) {
                    set_adminActivityLogs(logsData.data);
                }
            }
            catch (err) {
                console.error('Failed to fetch admin dashboard data:', err);
            }
        };
        fetchData();
    }, []);
    const activeCompanies = adminCompanies.filter(c => c.isActive || c.subscriptionStatus === 'active').length;
    const inactiveCompanies = adminCompanies.filter(c => !c.isActive || c.subscriptionStatus === 'inactive').length;
    const trialCompanies = adminCompanies.filter(c => c.subscriptionStatus === 'trial').length;
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.5rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "card", style: { padding: '1.25rem', borderLeft: '4px solid var(--purple)' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }, children: "Total Companies" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem' }, children: adminCompanies.length })] }), (0, jsx_runtime_1.jsx)("div", { style: { padding: '0.75rem', background: 'var(--purple-light)', borderRadius: 'var(--radius)', color: 'var(--purple)' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Building2, { size: 24 }) })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.8rem' }, children: [(0, jsx_runtime_1.jsxs)("span", { style: { color: 'var(--success)' }, children: ["\u25CF ", activeCompanies, " Active"] }), (0, jsx_runtime_1.jsxs)("span", { style: { color: 'var(--warning)' }, children: ["\u25CF ", trialCompanies, " Trial"] }), (0, jsx_runtime_1.jsxs)("span", { style: { color: 'var(--danger)' }, children: ["\u25CF ", inactiveCompanies, " Inactive"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { padding: '1.25rem', borderLeft: '4px solid var(--info)' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }, children: "System Activity Today" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem' }, children: "142" })] }), (0, jsx_runtime_1.jsx)("div", { style: { padding: '0.75rem', background: 'var(--info-light)', borderRadius: 'var(--radius)', color: 'var(--info-dark)' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Activity, { size: 24 }) })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Logins: 45" }), (0, jsx_runtime_1.jsx)("span", { children: "API Calls: 12.4k" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { padding: '1.25rem', borderLeft: '4px solid var(--success)' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }, children: "Backup Status" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem' }, children: ["5 ", (0, jsx_runtime_1.jsx)("span", { style: { fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }, children: "/ 6" })] })] }), (0, jsx_runtime_1.jsx)("div", { style: { padding: '0.75rem', background: 'var(--success-light)', borderRadius: 'var(--radius)', color: 'var(--success-dark)' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Database, { size: 24 }) })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.8rem' }, children: [(0, jsx_runtime_1.jsxs)("span", { style: { color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { size: 14 }), " 5 Completed"] }), (0, jsx_runtime_1.jsxs)("span", { style: { color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShieldAlert, { size: 14 }), " 1 Overdue"] })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsx)("h3", { className: "card-title", children: "Cross-Company Activity Logs" }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost btn-sm", children: "View All" })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", children: (0, jsx_runtime_1.jsx)("div", { className: "table-container", style: { border: 'none', borderRadius: 0 }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Time" }), (0, jsx_runtime_1.jsx)("th", { children: "Company" }), (0, jsx_runtime_1.jsx)("th", { children: "Action" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: adminActivityLogs.slice(0, 6).map(log => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: log.time }), (0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 500 }, children: log.company }), (0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsx)("span", { style: { fontSize: '0.8rem' }, children: log.action }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.7rem', color: 'var(--text-muted)' }, children: log.details })] })] }, log.id))) })] }) }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsx)("h3", { className: "card-title", children: "Backup Health Monitor" }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost btn-sm", children: "View Details" })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", children: (0, jsx_runtime_1.jsx)("div", { className: "table-container", style: { border: 'none', borderRadius: 0 }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Company" }), (0, jsx_runtime_1.jsx)("th", { children: "Last Backup" }), (0, jsx_runtime_1.jsx)("th", { children: "Status" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: adminCompanies.map(c => {
                                                    const isOverdue = c.lastBackup.includes('2025-06') || c.lastBackup.includes('2025-07-18');
                                                    return ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 500 }, children: c.name }), (0, jsx_runtime_1.jsx)("td", { style: { fontSize: '0.8rem', color: 'var(--text-secondary)' }, children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { size: 12 }), " ", c.lastBackup] }) }), (0, jsx_runtime_1.jsx)("td", { children: isOverdue ? ((0, jsx_runtime_1.jsx)("span", { className: "badge badge-danger", children: "Overdue" })) : ((0, jsx_runtime_1.jsx)("span", { className: "badge badge-success", children: "OK" })) })] }, c.id));
                                                }) })] }) }) })] })] })] }));
}
