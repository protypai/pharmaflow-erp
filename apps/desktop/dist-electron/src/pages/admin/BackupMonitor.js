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
const api_1 = require("../../config/api");
function BackupMonitor() {
    const [adminCompanies, set_adminCompanies] = (0, react_1.useState)([]);
    const [expandedCompanies, setExpandedCompanies] = (0, react_1.useState)({});
    const toggleExpand = (id) => {
        setExpandedCompanies(prev => ({ ...prev, [id]: !prev[id] }));
    };
    const fetchCompanies = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${api_1.API_BASE_URL}/api/v1/admin/companies`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json();
            if (res.ok && data.success) {
                set_adminCompanies(data.data || []);
            }
        }
        catch (err) {
            console.error('Failed to fetch backup statuses:', err);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchCompanies();
    }, []);
    const [search, setSearch] = (0, react_1.useState)('');
    const [triggering, setTriggering] = (0, react_1.useState)(null);
    const filtered = adminCompanies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.city.toLowerCase().includes(search.toLowerCase()));
    const handleTrigger = (id) => {
        setTriggering(id);
        setTimeout(() => setTriggering(null), 1500);
    };
    let healthyCount = 0;
    let overdueCount = 0;
    let criticalCount = 0;
    adminCompanies.forEach(c => {
        if (!c.lastBackup) {
            criticalCount++;
        }
        else {
            const lastBackupDate = new Date(c.lastBackup);
            const hoursDiff = (new Date().getTime() - lastBackupDate.getTime()) / (1000 * 60 * 60);
            if (c.unsyncedCount > 0 || c.lastSyncError) {
                if (hoursDiff > 24) {
                    criticalCount++;
                }
                else {
                    overdueCount++;
                }
            }
            else {
                healthyCount++;
            }
        }
    });
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsx)("h2", { className: "card-title", style: { fontSize: '1.1rem' }, children: "Global Backup Monitor" }), (0, jsx_runtime_1.jsxs)("div", { className: "search-bar", children: [(0, jsx_runtime_1.jsxs)("div", { className: "search-input-wrap", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 16, className: "search-icon" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", placeholder: "Search companies...", value: search, onChange: e => setSearch(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", style: { color: 'var(--purple)', borderColor: 'var(--purple)' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { size: 16 }), " Refresh Status"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', padding: '1.25rem', borderBottom: '1px solid var(--border)', background: '#FAFAFA' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { background: 'white', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { padding: '0.75rem', background: 'var(--success-light)', color: 'var(--success-dark)', borderRadius: '50%' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { size: 24 }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }, children: healthyCount }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }, children: "Healthy Backups" })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { background: 'white', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { padding: '0.75rem', background: 'var(--warning-light)', color: 'var(--warning-dark)', borderRadius: '50%' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { size: 24 }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }, children: overdueCount }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }, children: "Overdue (> 10 mins)" })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { background: 'white', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { padding: '0.75rem', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '50%' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.ShieldAlert, { size: 24 }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }, children: criticalCount }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }, children: "Critical / Failing" })] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Company Name" }), (0, jsx_runtime_1.jsx)("th", { children: "Location" }), (0, jsx_runtime_1.jsx)("th", { children: "Last Backup Time" }), (0, jsx_runtime_1.jsx)("th", { children: "Status" }), (0, jsx_runtime_1.jsx)("th", { children: "DB Size" }), (0, jsx_runtime_1.jsx)("th", { className: "col-actions", children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: filtered.map(company => {
                                const lastBackupDate = company.lastBackup ? new Date(company.lastBackup) : null;
                                const hoursDiff = lastBackupDate ? (new Date().getTime() - lastBackupDate.getTime()) / (1000 * 60 * 60) : Infinity;
                                const critical = !company.lastBackup || company.lastSyncError || hoursDiff > 24;
                                const overdue = company.unsyncedCount > 0 && hoursDiff <= 24;
                                const isExpanded = !!expandedCompanies[company.id];
                                return ((0, jsx_runtime_1.jsxs)(react_1.default.Fragment, { children: [(0, jsx_runtime_1.jsxs)("tr", { style: { background: critical ? 'var(--danger-light)' : overdue ? 'var(--warning-light)' : 'transparent', cursor: 'pointer' }, onClick: () => toggleExpand(company.id), children: [(0, jsx_runtime_1.jsxs)("td", { style: { fontWeight: 500, color: 'var(--text-primary)' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '0.35rem' }, children: [isExpanded ? (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { size: 15 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { size: 15 }), (0, jsx_runtime_1.jsx)("div", { children: company.name })] }), company.lastSyncError && ((0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.72rem', color: 'var(--danger)', marginTop: '2px', fontWeight: 500, paddingLeft: '1.25rem' }, children: ["\u26A0\uFE0F ", company.lastSyncError] }))] }), (0, jsx_runtime_1.jsx)("td", { children: company.city }), (0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 500 }, children: lastBackupDate ? lastBackupDate.toLocaleDateString('en-IN') : 'Never' }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: lastBackupDate ? lastBackupDate.toLocaleTimeString('en-IN') : '' })] }), (0, jsx_runtime_1.jsx)("td", { children: critical ? ((0, jsx_runtime_1.jsx)("span", { className: "badge badge-danger", children: "Critical" })) : overdue ? ((0, jsx_runtime_1.jsx)("span", { className: "badge badge-warning", children: "Overdue" })) : ((0, jsx_runtime_1.jsx)("span", { className: "badge badge-success", children: "Healthy" })) }), (0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 500 }, children: company.unsyncedCount > 0 ? `${company.unsyncedCount} pending` : 'All synced' }), (0, jsx_runtime_1.jsx)("td", { className: "col-actions", children: (0, jsx_runtime_1.jsxs)("button", { className: `btn btn-sm ${triggering === company.id ? 'btn-success' : 'btn-outline'}`, onClick: (e) => { e.stopPropagation(); handleTrigger(company.id); }, disabled: triggering === company.id, style: triggering === company.id ? {} : { color: 'var(--purple)', borderColor: 'var(--purple)' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Database, { size: 14 }), triggering === company.id ? 'Triggered!' : 'Force Backup'] }) })] }), isExpanded && ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsxs)("td", { colSpan: 6, style: { background: '#F8FAFC', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Laptop, { size: 14 }), " Connected Devices / Laptops (", company.devices?.length || 0, ")"] }), (!company.devices || company.devices.length === 0) ? ((0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '0.5rem 0' }, children: "No active laptop connections recorded yet." })) : ((0, jsx_runtime_1.jsxs)("table", { style: { width: '100%', background: 'white', borderRadius: '6px', border: '1px solid var(--border)', borderCollapse: 'collapse', fontSize: '0.8rem' }, children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { style: { background: '#F1F5F9', borderBottom: '1px solid var(--border)', textAlign: 'left' }, children: [(0, jsx_runtime_1.jsx)("th", { style: { padding: '6px 12px', fontWeight: 600 }, children: "Device ID" }), (0, jsx_runtime_1.jsx)("th", { style: { padding: '6px 12px', fontWeight: 600 }, children: "OS" }), (0, jsx_runtime_1.jsx)("th", { style: { padding: '6px 12px', fontWeight: 600 }, children: "App Version" }), (0, jsx_runtime_1.jsx)("th", { style: { padding: '6px 12px', fontWeight: 600 }, children: "Sync Status" }), (0, jsx_runtime_1.jsx)("th", { style: { padding: '6px 12px', fontWeight: 600 }, children: "Last Attempt" }), (0, jsx_runtime_1.jsx)("th", { style: { padding: '6px 12px', fontWeight: 600 }, children: "Last Success" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: company.devices.map(device => {
                                                                    const lastAttempt = new Date(device.lastSyncTime);
                                                                    const lastSuccess = device.lastSuccessSync ? new Date(device.lastSuccessSync) : null;
                                                                    return ((0, jsx_runtime_1.jsxs)("tr", { style: { borderBottom: '1px solid var(--border)' }, children: [(0, jsx_runtime_1.jsxs)("td", { style: { padding: '8px 12px', fontFamily: 'monospace', color: 'var(--text-primary)' }, title: device.deviceId, children: [device.deviceId.substring(0, 8), "..."] }), (0, jsx_runtime_1.jsx)("td", { style: { padding: '8px 12px', textTransform: 'capitalize' }, children: device.osPlatform || 'Windows' }), (0, jsx_runtime_1.jsxs)("td", { style: { padding: '8px 12px' }, children: ["v", device.appVersion] }), (0, jsx_runtime_1.jsxs)("td", { style: { padding: '8px 12px' }, children: [(0, jsx_runtime_1.jsxs)("span", { style: { display: 'inline-flex', alignItems: 'center', gap: '4px' }, children: [(0, jsx_runtime_1.jsx)("span", { style: { height: '7px', width: '7px', borderRadius: '50%', background: device.status === 'Success' ? 'var(--success-dark)' : device.status === 'Syncing' ? 'var(--warning-dark)' : 'var(--danger)' } }), (0, jsx_runtime_1.jsx)("span", { style: { fontWeight: 600, color: device.status === 'Success' ? 'var(--success-dark)' : device.status === 'Syncing' ? 'var(--warning-dark)' : 'var(--danger)' }, children: device.status })] }), device.errorMessage && ((0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.72rem', color: 'var(--danger)', marginTop: '2px', fontFamily: 'monospace' }, children: ["Error: ", device.errorMessage] }))] }), (0, jsx_runtime_1.jsx)("td", { style: { padding: '8px 12px' }, children: lastAttempt.toLocaleString('en-IN') }), (0, jsx_runtime_1.jsx)("td", { style: { padding: '8px 12px' }, children: lastSuccess ? lastSuccess.toLocaleString('en-IN') : 'Never' })] }, device.id));
                                                                }) })] }))] }) }))] }, company.id));
                            }) })] }) })] }));
}
